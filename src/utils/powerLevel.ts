export interface PLConfig {
  conStatInc: number;
  bpModeSquared: boolean;
}

// Mirrors JRMCoreHSklLvl.bpc(Entity) for EntityCreature in the mod.
// atr = maxHealth / conStatInc
// res = atr * 35  (sum of 10+4+6+10+5 stat weights)
// if BPMode == 1: res = res * floor(res / 2)
export function computePowerLevel(hpStr: string, cfg: PLConfig): number | null {
  const hp = Number(hpStr);
  if (!Number.isFinite(hp) || hp <= 0 || cfg.conStatInc <= 0) return null;
  const atr = Math.floor(hp / cfg.conStatInc);
  let res = Math.max(2, atr * 35);
  if (cfg.bpModeSquared) res = res * Math.floor(res / 2);
  return Math.max(1, res);
}
