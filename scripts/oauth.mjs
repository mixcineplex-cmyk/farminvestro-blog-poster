// One-time helper: get a Blogger refresh_token via OAuth (installed-app flow).
// Usage: set GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in env, then:
//   node scripts/oauth.mjs
// It prints an auth URL, you paste the returned code, it prints the refresh_token.
// The token is printed to stdout only — never written to a committed file.
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT = "urn:ietf:wg:oauth:2.0:oob";
const SCOPE = "https://www.googleapis.com/auth/blogger";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first.");
  process.exit(1);
}

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

console.log("\n1) Open this URL, approve, copy the code:\n");
console.log(authUrl + "\n");

const rl = createInterface({ input: stdin, output: stdout });
const code = (await rl.question("2) Paste code here: ")).trim();
rl.close();

const res = await fetch("https://oauth2.googleapis.com/token", {
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
if (!res.ok) {
  console.error("token exchange failed:", res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
if (!data.refresh_token) {
  console.error("No refresh_token returned. Revoke prior grant and retry with prompt=consent.");
  process.exit(1);
}
console.log("\nBLOGGER_REFRESH_TOKEN=" + data.refresh_token + "\n");
