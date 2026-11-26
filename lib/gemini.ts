const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const SITE = "https://www.eafarmforex.com";

const LANG_NAME: Record<string, string> = {
  en: "English",
  lo: "Lao",
  vi: "Vietnamese",
  id: "Indonesian",
  tl: "Filipino (Tagalog)",
  tr: "Turkish",
  ar: "Arabic",
  zh: "Simplified Chinese",
};

function buildPrompt(lang: string, topic: string): string {
  const name = LANG_NAME[lang] ?? lang;
  const link = `${SITE}/${lang}`;
  return [
    `Write a unique, natural SEO blog post of 350-500 words in ${name}.`,
    `Topic: "${topic.replace(/-/g, " ")}" in the context of a diversified USDT forex fund that spreads risk across multiple Expert Advisor (EA) strategies.`,
    `Include exactly ONE contextual backlink as an HTML anchor pointing to ${link} (use <a href="${link}">...</a>) with natural anchor text.`,
    `Add a short risk disclaimer. Do NOT guarantee returns or profits.`,
    `Return ONLY JSON: {"title": "...", "html": "..."} where html is body HTML (<p>, <h2>, <ul>). No markdown fences.`,
  ].join(" ");
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generatePost(
  lang: string,
  topic: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ title: string; html: string }> {
  const res = await fetchFn(`${ENDPOINT}?key=${process.env.GEMINI_API_KEY ?? ""}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(lang, topic) }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    throw new Error(`gemini http ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini: empty response");

  let parsed: { title?: string; html?: string };
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    throw new Error("gemini: response is not valid JSON");
  }
  const { title, html } = parsed;
  if (!title || !html) throw new Error("gemini: missing title/html");

  // Must contain the backlink to the correct domain + locale (guards link loss / domain injection).
  if (!html.includes(`href="${SITE}/${lang}`)) {
    throw new Error(`gemini: missing/invalid backlink to ${SITE}/${lang}`);
  }
  return { title, html };
}
