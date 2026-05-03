import type { DamageElement } from "./elements.js";

export type CasterStats = {
  strength: number;
  intelligence: number;
  chance: number;
  agility: number;
  power: number;
  damageAll: number;
  damageNeutral: number;
  damageEarth: number;
  damageFire: number;
  damageWater: number;
  damageAir: number;
  damageCrit: number;
  // Internal ratio: 0.25 means 25%. UI/API boundaries can convert whole percent values.
  critChance: number;
  finalDamagePercent?: number;
};

export type TargetStats = {
  resistancePercent: number;
  resistanceFlat: number;
  criticalResistance: number;
};

export const NAKED_LEVEL_200_CASTER_STATS: CasterStats = {
  strength: 100,
  intelligence: 100,
  chance: 100,
  agility: 100,
  power: 0,
  damageAll: 0,
  damageNeutral: 0,
  damageEarth: 0,
  damageFire: 0,
  damageWater: 0,
  damageAir: 0,
  damageCrit: 0,
  critChance: 0,
  finalDamagePercent: 0
};

export function getElementalFlatDamage(stats: CasterStats, element: DamageElement): number {
  switch (element) {
    case "neutral":
      return stats.damageNeutral;
    case "earth":
      return stats.damageEarth;
    case "fire":
      return stats.damageFire;
    case "water":
      return stats.damageWater;
    case "air":
      return stats.damageAir;
  }
}
