import type { CasterStats } from "../domain/stats.js";
import { DofusDbClient } from "./client.js";
import type { DofusDbStuff } from "./types.js";

const CHARACTERISTIC_IDS = {
  strength: "10",
  vitality: "11",
  wisdom: "12",
  chance: "13",
  agility: "14",
  intelligence: "15",
  damageAll: "16",
  critChance: "18",
  range: "19",
  movementPoints: "23",
  power: "25",
  summons: "26",
  damageAirFlatResistance: "57",
  damageNeutralFlatResistance: "58",
  damageCrit: "86",
  criticalFlatResistance: "87",
  damageEarth: "88",
  damageFire: "89",
  damageWater: "90",
  damageAir: "91",
  damageNeutral: "92",
  finalSpellDamagePercent: "123"
} as const;

export async function fetchStuff(
  stuffId: string,
  client = new DofusDbClient()
): Promise<DofusDbStuff> {
  return client.get<DofusDbStuff>(`/stuffs/${stuffId}`);
}

export function mapStuffToCasterStats(stuff: DofusDbStuff): CasterStats {
  const stats = stuff.stats ?? {};

  return {
    strength: getStat(stats, CHARACTERISTIC_IDS.strength),
    intelligence: getStat(stats, CHARACTERISTIC_IDS.intelligence),
    chance: getStat(stats, CHARACTERISTIC_IDS.chance),
    agility: getStat(stats, CHARACTERISTIC_IDS.agility),
    power: getStat(stats, CHARACTERISTIC_IDS.power),
    damageAll: getStat(stats, CHARACTERISTIC_IDS.damageAll),
    damageNeutral: getStat(stats, CHARACTERISTIC_IDS.damageNeutral),
    damageEarth: getStat(stats, CHARACTERISTIC_IDS.damageEarth),
    damageFire: getStat(stats, CHARACTERISTIC_IDS.damageFire),
    damageWater: getStat(stats, CHARACTERISTIC_IDS.damageWater),
    damageAir: getStat(stats, CHARACTERISTIC_IDS.damageAir),
    damageCrit: getStat(stats, CHARACTERISTIC_IDS.damageCrit),
    critChance: getStat(stats, CHARACTERISTIC_IDS.critChance) / 100,
    finalDamagePercent: getStat(stats, CHARACTERISTIC_IDS.finalSpellDamagePercent)
  };
}

function getStat(stats: Record<string, number>, id: string): number {
  return stats[id] ?? 0;
}
