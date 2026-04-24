export interface PLConfig {
  conStatInc: number;
  bpModeSquared: boolean;
}

// Mirrors JRMCoreHSklLvl.bpc(Entity) for EntityCreature in the mod.
// Enemies don't have stored stats; the mod back-converts maxHealth into a
// player-equivalent attribute count using a player's HP-per-CON ratio
// (statInc(ki, CON, 1, race=0, class=0, 0)), then sums all 5 stat weights
// (10+4+6+10+5 = 35) as if every stat equalled that count.
// atr = maxHealth / conStatInc
// res = atr * 35
// if BPMode == 1 (scouter "High"): res = res * floor(res / 2)
export function computePowerLevel(hpStr: string, cfg: PLConfig): number | null {
  const hp = Number(hpStr);
  if (!Number.isFinite(hp) || hp <= 0 || cfg.conStatInc <= 0) return null;
  const atr = Math.floor(hp / cfg.conStatInc);
  let res = Math.max(2, atr * 35);
  if (cfg.bpModeSquared) res = res * Math.floor(res / 2);
  if (!Number.isSafeInteger(res)) return null;
  return Math.max(1, res);
}
