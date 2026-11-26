import { test, expect } from "vitest";
import { pickSlot, NONTHAI, TOPICS } from "./rotation";

test("non-post day returns null", () => {
  expect(pickSlot(new Date("2026-11-24T10:00:00Z"))).toBeNull(); // Tue
  expect(pickSlot(new Date("2026-11-28T10:00:00Z"))).toBeNull(); // Sat
});

test("Mon/Wed/Fri give slots 0/1/2 in same week", () => {
  const mon = pickSlot(new Date("2026-11-23T10:00:00Z"))!; // Mon
  const wed = pickSlot(new Date("2026-11-25T10:00:00Z"))!;
  const fri = pickSlot(new Date("2026-11-27T10:00:00Z"))!;
  expect([mon.postIndex, wed.postIndex, fri.postIndex]).toEqual([
    mon.postIndex,
    mon.postIndex + 1,
    mon.postIndex + 2,
  ]);
  expect(NONTHAI).toHaveLength(8);
  expect(NONTHAI).not.toContain("th");
  expect(mon.lang).toBe(NONTHAI[mon.postIndex % 8]);
  expect(mon.topic).toBe(TOPICS[mon.postIndex % TOPICS.length]);
});

test("same day deterministic", () => {
  const a = pickSlot(new Date("2026-11-25T01:00:00Z"))!;
  const b = pickSlot(new Date("2026-11-25T23:00:00Z"))!;
  expect(a).toEqual(b);
});
