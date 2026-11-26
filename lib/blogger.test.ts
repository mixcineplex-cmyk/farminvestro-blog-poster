import { test, expect } from "vitest";
import { getAccessToken, hasAutoPostToday, publishPost } from "./blogger";

const jsonResp = (body: unknown) =>
  (async () => ({ ok: true, json: async () => body }) as unknown as Response) as unknown as typeof fetch;

test("getAccessToken returns token", async () => {
  expect(await getAccessToken(jsonResp({ access_token: "AT" }))).toBe("AT");
});

test("getAccessToken throws on failure", async () => {
  const f = (async () => ({ ok: false, status: 400, text: async () => "bad" }) as unknown as Response) as unknown as typeof fetch;
  await expect(getAccessToken(f)).rejects.toThrow();
});

test("hasAutoPostToday true when item published today", async () => {
  const today = new Date("2026-11-25T10:00:00Z");
  const f = jsonResp({ items: [{ published: "2026-11-25T08:00:00Z" }] });
  expect(await hasAutoPostToday("AT", today, f)).toBe(true);
});

test("hasAutoPostToday false when none today", async () => {
  const today = new Date("2026-11-25T10:00:00Z");
  const f = jsonResp({ items: [{ published: "2026-11-20T08:00:00Z" }] });
  expect(await hasAutoPostToday("AT", today, f)).toBe(false);
});

test("hasAutoPostToday false when no items", async () => {
  const today = new Date("2026-11-25T10:00:00Z");
  expect(await hasAutoPostToday("AT", today, jsonResp({}))).toBe(false);
});

test("publishPost returns url", async () => {
  const f = jsonResp({ url: "https://farminvestro.blogspot.com/p" });
  const r = await publishPost("AT", "T", "<p>x</p>", ["auto", "en"], f);
  expect(r.url).toContain("blogspot");
});
