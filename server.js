const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

const store = {};

function getStore(code, key) {
  return (store[code] && store[code][key] !== undefined) ? store[code][key] : null;
}
function setStore(code, key, value) {
  if (!store[code]) store[code] = {};
  store[code][key] = value;
}
function deleteStore(code, key) {
  if (store[code]) delete store[code][key];
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch(e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(); return;
  }

  if (method === 'POST' && url === '/rewrite') {
    if (!API_KEY) { json(res, 503, { error: 'API key not configured.' }); return; }
    let payload;
    try { payload = await readBody(req); } catch(e) { json(res, 400, { error: 'Bad JSON' }); return; }

    const postData = JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      system: payload.system,
      messages: payload.messages
    });
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const apiReq = https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', c => { data += c; });
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });
    apiReq.on('error', e => json(res, 500, { error: e.message }));
    apiReq.write(postData);
    apiReq.end();
    return;
  }

  const storeMatch = url.match(/^\/store\/([^/]+)\/([^/]+)$/);
  if (storeMatch) {
    const [, code, key] = storeMatch;
    if (method === 'GET') {
      const value = getStore(code, key);
      if (value === null) { json(res, 404, { error: 'Not found' }); return; }
      json(res, 200, { value });
      return;
    }
    if (method === 'POST') {
      let payload;
      try { payload = await readBody(req); } catch(e) { json(res, 400, { error: 'Bad JSON' }); return; }
      setStore(code, key, payload.value);
      json(res, 200, { ok: true });
      return;
    }
    if (method === 'DELETE') {
      deleteStore(code, key);
      json(res, 200, { ok: true });
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const served = HTML.replace(
    '/* SERVER_API_AVAILABLE */',
    `window.SERVER_API_AVAILABLE = ${API_KEY ? 'true' : 'false'};`
  );
  res.end(served);

}).listen(PORT, () => {
  console.log(`Diplomatic Channel running on port ${PORT}`);
  console.log(`Period voice: ${API_KEY ? 'ENABLED' : 'DISABLED (set ANTHROPIC_API_KEY)'}`);
});
