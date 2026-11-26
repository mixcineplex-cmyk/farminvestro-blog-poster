import { test, expect } from "vitest";
import { generatePost } from "./gemini";

function resp(text: string) {
  return async () =>
    ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
    }) as unknown as Response;
}

test("parses title+html with valid backlink", async () => {
  const html = `<p>x</p><p><a href="https://www.eafarmforex.com/en">Farm Investro</a></p>`;
  const r = await generatePost("en", "t", resp(JSON.stringify({ title: "T", html })) as unknown as typeof fetch);
  expect(r.title).toBe("T");
  expect(r.html).toContain("eafarmforex.com/en");
});

test("strips ```json fences", async () => {
  const html = `<a href="https://www.eafarmforex.com/vi">f</a>`;
  const text = "```json\n" + JSON.stringify({ title: "T", html }) + "\n```";
  const r = await generatePost("vi", "t", resp(text) as unknown as typeof fetch);
  expect(r.title).toBe("T");
});

test("rejects when backlink missing", async () => {
  await expect(
    generatePost("en", "t", resp(JSON.stringify({ title: "T", html: "<p>no link</p>" })) as unknown as typeof fetch),
  ).rejects.toThrow();
});

test("rejects wrong/injected domain", async () => {
  const bad = `<a href="https://evil.com/en">x</a>`;
  await expect(
    generatePost("en", "t", resp(JSON.stringify({ title: "T", html: bad })) as unknown as typeof fetch),
  ).rejects.toThrow();
});
