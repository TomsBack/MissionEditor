import { describe, expectTypeOf, it } from "vitest";
import { useHistory } from "./history";
import { parseObjective } from "./objectives";
import { parseReward } from "./rewards";
import { computePowerLevel } from "./powerLevel";
import { loadSettings, type EditorSettings } from "./settings";
import { THEMES, isThemeName, type ThemeName } from "./theme";
import type { Objective, ObjectiveType, RewardChoice, RewardComponent } from "../types/mission";

describe("parser return types", () => {
  it("parseObjective returns the full Objective shape", () => {
    expectTypeOf(parseObjective).returns.toEqualTypeOf<Objective>();
  });

  it("Objective.type is the literal union, not a bare string", () => {
    expectTypeOf<Objective["type"]>().toEqualTypeOf<ObjectiveType>();
    expectTypeOf<ObjectiveType>().toEqualTypeOf<
      | "kill" | "killsame" | "biome" | "biome2" | "dim" | "dim2"
      | "item" | "talk" | "state" | "lvl"
      | "next" | "start" | "skip" | "restart"
    >();
  });

  it("parseReward returns RewardChoice with a typed component array", () => {
    expectTypeOf(parseReward).returns.toEqualTypeOf<RewardChoice>();
    expectTypeOf<RewardChoice["components"]>().toEqualTypeOf<RewardComponent[]>();
    expectTypeOf<RewardComponent["type"]>().toEqualTypeOf<
      "nothing" | "tp" | "item" | "align" | "com"
    >();
  });

  it("nextMissionId is a number, not a string", () => {
    expectTypeOf<RewardChoice["nextMissionId"]>().toEqualTypeOf<number>();
  });
});

describe("nullable returns", () => {
  it("computePowerLevel returns number | null", () => {
    expectTypeOf(computePowerLevel).returns.toEqualTypeOf<number | null>();
  });
});

describe("useHistory generic", () => {
  it("preserves the state type through the hook", () => {
    type StringHook = ReturnType<typeof useHistory<string>>;
    expectTypeOf<StringHook["state"]>().toEqualTypeOf<string>();
    expectTypeOf<StringHook["set"]>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<StringHook["reset"]>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<StringHook["canUndo"]>().toEqualTypeOf<boolean>();
  });

  it("works with array state and complex objects", () => {
    type ArrayHook = ReturnType<typeof useHistory<{ id: number; tags: string[] }[]>>;
    expectTypeOf<ArrayHook["state"]>().toEqualTypeOf<{ id: number; tags: string[] }[]>();
  });

  it("set accepts an optional immediate flag", () => {
    type Setter = ReturnType<typeof useHistory<number>>["set"];
    expectTypeOf<Setter>().parameter(1).toEqualTypeOf<boolean | undefined>();
  });
});

describe("settings shape", () => {
  it("loadSettings returns the public EditorSettings type, no __version", () => {
    expectTypeOf(loadSettings).returns.toEqualTypeOf<EditorSettings>();
    // @ts-expect-error __version must not be on the public shape
    type _LeakCheck = EditorSettings["__version"];
  });

  it("theme field is the registry-driven ThemeName, not a free string", () => {
    expectTypeOf<EditorSettings["theme"]>().toEqualTypeOf<ThemeName>();
    // A bare string assignment must fail.
    // @ts-expect-error 'midnight' is not a registered theme name
    const _bad: EditorSettings["theme"] = "midnight";
  });

  it("alignment is constrained to the three-value union", () => {
    expectTypeOf<EditorSettings["defaultAlignment"]>().toEqualTypeOf<"good" | "neutral" | "evil">();
  });
});

describe("theme registry", () => {
  it("THEMES keys match ThemeName exactly", () => {
    type RegistryKey = keyof typeof THEMES;
    expectTypeOf<RegistryKey>().toEqualTypeOf<ThemeName>();
  });

  it("isThemeName narrows unknown to ThemeName", () => {
    const v: unknown = "dark";
    if (isThemeName(v)) {
      expectTypeOf(v).toEqualTypeOf<ThemeName>();
    }
  });
});
