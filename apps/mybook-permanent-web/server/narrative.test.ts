import { describe, expect, it } from "vitest";
import { advanceState, normalizeAct, normalizeChoices } from "./narrative";

describe("narrative payload normalization", () => {
  it("always produces three addressable choices for the UI", () => {
    const choices = normalizeChoices([{ text: "Stay", revealText: "A", axis: "Trust", delta: 8 }]);
    expect(choices).toHaveLength(3);
    expect(choices.map(choice => choice.id)).toEqual(["A", "B", "C"]);
    expect(choices[0]).toMatchObject({ text: "Stay", delta: 8 });
    expect(choices[1].text).toBe("");
  });

  it("keeps prose available before choices are resolved", () => {
    const act = normalizeAct({ title: "A room", sceneName: "Doorway", messages: [{ text: "I wait." }] }, 2, false);
    expect(act.number).toBe(2);
    expect(act.messages).toHaveLength(1);
    expect(act.choices).toEqual([]);
    expect(act.consequences).toEqual([]);
  });

  it("connects consequences to the three choice ids", () => {
    const act = normalizeAct({ choices: [{ text: "A" }, { text: "B" }, { text: "C" }], consequences: [{ text: "first" }, { text: "second" }, { text: "third" }] }, 1, true);
    expect(act.consequences.map(item => item.choiceId)).toEqual(["A", "B", "C"]);
    expect(act.consequences[2]?.text).toBe("third");
  });

  it("escalates pressure only in extreme mode and records the choice", () => {
    const base = { bookTitle: "Book", character: "Role", locale: "zh-CN" as const, actNumber: 1, maxActs: 3, pressureLevel: 1, axes: [{ key: "Trust", low: "low", high: "high", value: 50 }], history: [] };
    const choice = { id: "A" as const, text: "Stay", revealText: "", axis: "Trust", delta: 12 };
    const extreme = advanceState({ ...base, mode: "extreme" as const }, choice);
    const normal = advanceState({ ...base, mode: "normal" as const, pressureLevel: 0 }, choice);
    expect(extreme.pressureLevel).toBe(2);
    expect(normal.pressureLevel).toBe(0);
    expect(extreme.axes[0]?.value).toBe(62);
    expect(extreme.history).toHaveLength(1);
  });
});
