import { test, expect } from "vitest";
import { runPost, type Deps } from "./post";

const deps = (over: Partial<Deps> = {}): Deps => ({
  pickSlot: () => ({ lang: "en", topic: "t", postIndex: 0 }),
  generatePost: async () => ({ title: "T", html: "<a>x</a>" }),
  getAccessToken: async () => "AT",
  hasAutoPostToday: async () => false,
  publishPost: async () => ({ url: "U" }),
  ...over,
});

test("skips on non-post day (no Gemini/Blogger calls)", async () => {
  let gen = false;
  const r = await runPost(
    new Date(),
    deps({ pickSlot: () => null, generatePost: async () => { gen = true; return { title: "", html: "" }; } }),
  );
  expect(r.skipped).toBe(true);
  expect(gen).toBe(false);
});

test("skips when already posted today", async () => {
  const r = await runPost(new Date(), deps({ hasAutoPostToday: async () => true }));
  expect(r.skipped).toBe(true);
});

test("publishes and returns url", async () => {
  const r = await runPost(new Date(), deps());
  expect(r.url).toBe("U");
  expect(r.lang).toBe("en");
  expect(r.topic).toBe("t");
});
