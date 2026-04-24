import { describe, expect, it } from "vitest";
import { parseObjective, serializeObjective } from "./objectives";

describe("parseObjective", () => {
  it("parses a kill objective with health and attack", () => {
    const o = parseObjective("kill;NZombie;H100;A10");
    expect(o.type).toBe("kill");
    expect(o.name).toBe("Zombie");
    expect(o.health).toBe("100");
    expect(o.attack).toBe("10");
  });

  it("parses a killsame with amount", () => {
    const o = parseObjective("killsame;NZombie;M5;H50");
    expect(o.type).toBe("killsame");
    expect(o.amount).toBe("5");
    expect(o.health).toBe("50");
  });

  it("defaults to 'next' for empty input", () => {
    expect(parseObjective("").type).toBe("next");
  });

  it("ignores unknown keys without throwing", () => {
    const o = parseObjective("kill;NZombie;X42;Z99");
    expect(o.name).toBe("Zombie");
  });

  it("preserves multi-character values", () => {
    const o = parseObjective("kill;Nminecraft:Zombie;Smsg.spawn");
    expect(o.name).toBe("minecraft:Zombie");
    expect(o.spawnMessage).toBe("msg.spawn");
  });
});

describe("serializeObjective", () => {
  it("emits button-only types without fields", () => {
    expect(serializeObjective(parseObjective("next"))).toBe("next");
    expect(serializeObjective(parseObjective("start"))).toBe("start");
  });

  it("round-trips a populated kill objective", () => {
    const raw = "kill;NZombie;H100;A10;Sspawn;Ddeath";
    const parsed = parseObjective(raw);
    const out = serializeObjective(parsed);
    // Field order is determined by REVERSE_KEY_MAP, not input order, so re-parse to compare semantically.
    expect(parseObjective(out)).toEqual(parsed);
  });

  it("omits empty fields", () => {
    const o = parseObjective("kill;NZombie");
    const out = serializeObjective(o);
    expect(out).toBe("kill;NZombie");
    expect(out).not.toContain("H");
    expect(out).not.toContain("A");
  });
});
