# Secret Diplomatic Channel

A dispatch tool for Reacting to the Past classrooms. Factions send secret messages to each other. Every message passes through the instructor before delivery. Nothing reaches a student's inbox without your approval.

Built for RTTP's July 1914 and similar negotiation games, but works with any scenario and any set of factions.

---

## How it works

You open a session and get a six-character code — something like `JULY14`. Students open the app on their phones or laptops, enter the code, and claim a faction. First to claim it owns it for the session.

From there, any faction can compose a dispatch to any other faction. It goes into your queue immediately and stays invisible to the recipient until you act on it. You can approve it, hold it until later, block it entirely, or intercept it — forwarding a copy to a third faction with an optional cover note.

You can also originate dispatches yourself, without waiting for students to write first.

---

## Instructor controls

**Approve** — dispatch delivers to the recipient's inbox.

**Hold** — stays in your queue. Useful when the timing isn't right yet. Release it later.

**Block** — dispatch is logged but never delivered. The sender sees it marked blocked in their sent history.

**Intercept** — you forward a copy to a third faction, simulating intelligence interception. Choose the recipient, add an optional anonymous cover note, and the original is also delivered. The intercepted copy arrives stamped INTERCEPTED with the original routing visible.

---

## Instructor-originated dispatches

The **Send Dispatch** tab in the instructor console has four modes:

**Telegraph Office** — sends as the Telegraph Office to one faction. Good for introducing historical events or official communiqués.

**Anonymous Tip** — no sender visible. The recipient has no way of knowing whether it came from another faction, you, or nowhere.

**Broadcast** — delivers to every faction simultaneously. Add a headline (e.g. *ARCHDUKE FRANZ FERDINAND ASSASSINATED IN SARAJEVO*) that appears above the message in bold. Good for introducing game-changing events mid-session.

**Impersonate** — appears to come from a named faction. That faction has no idea it was sent on their behalf. Use carefully.

All four bypass the approval queue and deliver immediately.

---

## Period voice

If an Anthropic API key is configured on the server, every dispatch gets rewritten as a period-authentic telegram before delivery — STOP punctuation, datelines, formal register. Students see the period version; you see both the original text and the rewrite in your queue.

The key lives in Railway's environment variables and never touches the browser.

---

## Access control

Two layers protect the instructor console.

**URL gate** — the instructor interface only appears at `yourdomain.com?instructor`. The plain URL shows students only the faction join screen, with no trace of instructor controls.

**PIN** — when you create a session, you set a PIN. Anyone reaching the instructor URL still needs the correct PIN to enter the console. The PIN is hashed with SHA-256 before storage — plain text is never saved anywhere.

Share the plain URL with students. Keep the `?instructor` URL to yourself.

---

## Setup

### Deploy to Railway

1. Push the contents of `railway-deploy.zip` to a GitHub repository.
2. Create a new project at [railway.app](https://railway.app) and connect the repo.
3. In your Railway service, go to **Variables** and add:
   - `ANTHROPIC_API_KEY` — your Anthropic API key (optional, enables period voice)
4. Railway deploys automatically on every push.

### Connect your domain (Cloudflare)

1. In Railway: **Settings → Networking → Custom Domain** — add your subdomain (e.g. `dispatch.yourdomain.com`). Railway gives you a CNAME target.
2. Via your webhosting service: **DNS → Add record**

   | Field | Value |
   |-------|-------|
   | Type | CNAME |
   | Name | `dispatch` |
   | Target | your Railway CNAME |
   | Proxy status | DNS only (grey cloud) |

   The proxy must be off — Railway handles SSL itself.

3. Railway provisions the certificate within a few minutes of detecting the DNS record.

### Running a session

1. Open `yourdomain.com?instructor` on your device.
2. Set your PIN, choose your scenario and factions, click **Open Session**.
3. Write the session code on the board.
4. Students open the plain URL, enter the code, claim a faction.
5. Dispatches appear in your queue as students send them.
6. Click **Close Session** at the end of class.

If you close your tab mid-session, return to `?instructor` and use **Rejoin as Instructor** — enter your session code and PIN to get back to the live console.

---

## Notes

Multiple simultaneous sessions work fine — each has its own code and isolated dispatch history.

All session data is scoped to the shared storage tied to this deployment. Nothing is sent to third parties beyond the Anthropic API call for period voice rewriting (if enabled).

Students identify only by faction name. No accounts, no personal data collected.
