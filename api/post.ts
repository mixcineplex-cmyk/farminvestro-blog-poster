import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pickSlot } from "../lib/rotation.js";
import { generatePost } from "../lib/gemini.js";
import { getAccessToken, hasAutoPostToday, publishPost } from "../lib/blogger.js";

export type Deps = {
  pickSlot: typeof pickSlot;
  generatePost: typeof generatePost;
  getAccessToken: typeof getAccessToken;
  hasAutoPostToday: typeof hasAutoPostToday;
  publishPost: typeof publishPost;
};

export type Result =
  | { skipped: true; reason: string }
  | { ok: true; skipped?: false; lang: string; topic: string; url: string };

export async function runPost(now: Date, deps: Deps): Promise<Result> {
  const slot = deps.pickSlot(now);
  if (!slot) return { skipped: true, reason: "not a post day" };

  const token = await deps.getAccessToken();
  if (await deps.hasAutoPostToday(token, now)) {
    return { skipped: true, reason: "already posted today" };
  }

  const { title, html } = await deps.generatePost(slot.lang, slot.topic);
  const { url } = await deps.publishPost(token, title, html, ["auto", slot.lang]);
  return { ok: true, lang: slot.lang, topic: slot.topic, url };
}

const realDeps: Deps = { pickSlot, generatePost, getAccessToken, hasAutoPostToday, publishPost };

function authorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.authorization;
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const q = typeof req.query.secret === "string" ? req.query.secret : null;
  return bearer === secret || q === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!authorized(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const result = await runPost(new Date(), realDeps);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
