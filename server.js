const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

http.createServer(async (req, res) => {

  // ── POST /rewrite — proxy to Anthropic, key never leaves server ──
  if (req.method === 'POST' && req.url === '/rewrite') {
    if (!API_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API key not configured on server.' }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch(e) {
        res.writeHead(400); res.end('Bad JSON'); return;
      }
      const postData = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
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
        apiRes.on('data', chunk => { data += chunk; });
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });
      apiReq.on('error', e => {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      });
      apiReq.write(postData);
      apiReq.end();
    });
    return;
  }

  // ── GET /* — serve the app ──
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  // Let the client know whether period-voice is available (true/false only — not the key)
  const withApiStatus = HTML.replace(
    '/* SERVER_API_AVAILABLE */',
    `window.SERVER_API_AVAILABLE = ${API_KEY ? 'true' : 'false'};`
  );
  res.end(withApiStatus);

}).listen(PORT, () => {
  console.log(`Diplomatic Channel running on port ${PORT}`);
  console.log(`Period voice: ${API_KEY ? 'ENABLED' : 'DISABLED (set ANTHROPIC_API_KEY)'}`);
});
