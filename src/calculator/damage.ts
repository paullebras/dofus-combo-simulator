import { getElementStatKey } from "../domain/elements.js";
import type { CasterStats } from "../domain/stats.js";
import { getElementalFlatDamage } from "../domain/stats.js";
import type { Spell, SpellDamageLine } from "../domain/spell.js";

export type DamageRange = {
  min: number;
  max: number;
  average: number;
};

export type DamageLineResult = {
  normal: DamageRange;
  crit: DamageRange;
  expected: DamageRange;
};

export type SpellDamageResult = {
  spellId: number;
  spellName: string;
  apCost: number;
  normal: DamageRange;
  crit: DamageRange;
  expected: DamageRange;
  damagePerAp: number;
  lines: DamageLineResult[];
};

export type DamageCalculationOptions = {
  baseDamageBonus?: number;
};

export function calculateSpellDamage(
  spell: Spell,
  stats: CasterStats,
  options: DamageCalculationOptions = {},
): SpellDamageResult {
  const critChance = clamp01(stats.critChance + spell.baseCritChance);
  const lines = spell.damageLines.map((line) =>
    calculateDamageLine(line, stats, critChance, options),
  );
  const normal = sumRanges(lines.map((line) => line.normal));
  const crit = sumRanges(lines.map((line) => line.crit));
  const expected = sumRanges(lines.map((line) => line.expected));

  return {
    spellId: spell.id,
    spellName: spell.name,
    apCost: spell.apCost,
    normal,
    crit,
    expected,
    damagePerAp: spell.apCost > 0 ? expected.average / spell.apCost : 0,
    lines,
  };
}

function calculateDamageLine(
  line: SpellDamageLine,
  stats: CasterStats,
  critChance: number,
  options: DamageCalculationOptions,
): DamageLineResult {
  const normal = calculateDamageRange(
    line,
    stats,
    line.normalMin + (options.baseDamageBonus ?? 0),
    line.normalMax + (options.baseDamageBonus ?? 0),
    false,
  );
  const crit = calculateDamageRange(
    line,
    stats,
    (line.critMin ?? line.normalMin) + (options.baseDamageBonus ?? 0),
    (line.critMax ?? line.normalMax) + (options.baseDamageBonus ?? 0),
    true,
  );

  return {
    normal,
    crit,
    expected: {
      min: normal.min * (1 - critChance) + crit.min * critChance,
      max: normal.max * (1 - critChance) + crit.max * critChance,
      average: normal.average * (1 - critChance) + crit.average * critChance,
    },
  };
}

function calculateDamageRange(
  line: SpellDamageLine,
  stats: CasterStats,
  baseMin: number,
  baseMax: number,
  isCrit: boolean,
): DamageRange {
  const min = applyFormula(line, stats, baseMin, isCrit);
  const max = applyFormula(line, stats, baseMax, isCrit);

  return {
    min,
    max,
    average: average(min, max),
  };
}

function applyFormula(
  line: SpellDamageLine,
  stats: CasterStats,
  baseDamage: number,
  isCrit: boolean,
): number {
  const statKey = getElementStatKey(line.element);
  const statMultiplier = 1 + (stats[statKey] + stats.power) / 100;
  const flatDamage =
    stats.damageAll + getElementalFlatDamage(stats, line.element);
  const critDamage = isCrit ? stats.damageCrit : 0;
  const finalMultiplier = 1 + (stats.finalDamagePercent ?? 0) / 100;

  return (
    (baseDamage * statMultiplier + flatDamage + critDamage) * finalMultiplier
  );
}

function average(min: number, max: number): number {
  return (min + max) / 2;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function sumRanges(ranges: DamageRange[]): DamageRange {
  return {
    min: sum(ranges.map((range) => range.min)),
    max: sum(ranges.map((range) => range.max)),
    average: sum(ranges.map((range) => range.average)),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
