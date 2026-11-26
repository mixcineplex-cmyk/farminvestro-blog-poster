const TOKEN_URL = "https://oauth2.googleapis.com/token";
const BASE = "https://www.googleapis.com/blogger/v3";

function blogId(): string {
  return process.env.BLOGGER_BLOG_ID ?? "";
}

export async function getAccessToken(fetchFn: typeof fetch = fetch): Promise<string> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    refresh_token: process.env.BLOGGER_REFRESH_TOKEN ?? "",
    grant_type: "refresh_token",
  });
  const res = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`oauth token http ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("oauth: no access_token");
  return data.access_token;
}

function utcDay(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export async function hasAutoPostToday(
  token: string,
  now: Date,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const url = `${BASE}/blogs/${blogId()}/posts?labels=auto&maxResults=5&fetchBodies=false`;
  const res = await fetchFn(url, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`blogger list http ${res.status}`);
  const data = (await res.json()) as { items?: { published?: string }[] };
  const today = utcDay(now);
  return (data.items ?? []).some((p) => p.published && utcDay(p.published) === today);
}

export async function publishPost(
  token: string,
  title: string,
  html: string,
  labels: string[],
  fetchFn: typeof fetch = fetch,
): Promise<{ url: string }> {
  const url = `${BASE}/blogs/${blogId()}/posts/`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ kind: "blogger#post", title, content: html, labels }),
  });
  if (!res.ok) throw new Error(`blogger insert http ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { url?: string };
  return { url: data.url ?? "" };
}
