// One-time helper: get a Blogger refresh_token via OAuth (Desktop app, loopback flow).
// Google removed the oob flow (2022), so this starts a localhost server to catch the redirect.
//
// Usage (reads the client secret JSON you downloaded from Google Cloud):
//   node scripts/oauth.mjs ./client_secret_XXX.json
// or with env vars instead of the JSON:
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... node scripts/oauth.mjs
//
// It prints an auth URL, opens your browser, you approve, and it prints the refresh_token.
// The token is printed to stdout only — never written to a committed file.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { argv, env, exit } from "node:process";

function creds() {
  const path = argv[2];
  if (path) {
    const j = JSON.parse(readFileSync(path, "utf8"));
    const c = j.installed ?? j.web ?? j;
    return { id: c.client_id, secret: c.client_secret };
  }
  return { id: env.GOOGLE_OAUTH_CLIENT_ID, secret: env.GOOGLE_OAUTH_CLIENT_SECRET };
}

const { id: CLIENT_ID, secret: CLIENT_SECRET } = creds();
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Provide a client secret JSON path, or set GOOGLE_OAUTH_CLIENT_ID/SECRET.");
  exit(1);
}

const PORT = 5e3 + Math.floor(Math.random() * 1000);
const REDIRECT = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/blogger";

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  }).toString();

console.log("\nOpen this URL, approve (click Advanced > Go to ... if it warns unverified):\n");
console.log(authUrl + "\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("no code");
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" }).end("Done. You can close this tab.");
  server.close();
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) {
    console.error("token exchange failed:", r.status, await r.text());
    exit(1);
  }
  const data = await r.json();
  if (!data.refresh_token) {
    console.error("No refresh_token. Revoke prior grant and retry (prompt=consent).");
    exit(1);
  }
  console.log("\nBLOGGER_REFRESH_TOKEN=" + data.refresh_token + "\n");
  exit(0);
});
server.listen(PORT, () => console.log(`Waiting for redirect on ${REDIRECT} ...`));
