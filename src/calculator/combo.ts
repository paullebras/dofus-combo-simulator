import { calculateSpellDamage, type DamageRange, type SpellDamageResult } from "./damage.js";
import type { Combo } from "../domain/combo.js";
import type { CasterStats } from "../domain/stats.js";
import type { Spell } from "../domain/spell.js";

export type ComboStepResult = {
  label: string;
  spellName: string;
  casts: number;
  note?: string;
  baseDamageBonus?: number;
  damage: SpellDamageResult;
  totalNormal: DamageRange;
  totalCrit: DamageRange;
  totalExpected: DamageRange;
  totalAp: number;
};

export type ComboResult = {
  comboId: string;
  comboName: string;
  steps: ComboStepResult[];
  totalNormal: DamageRange;
  totalCrit: DamageRange;
  totalExpected: DamageRange;
  totalAp: number;
  expectedDamagePerAp: number;
  notes: string[];
};

export function calculateComboDamage(
  combo: Combo,
  spells: Spell[],
  stats: CasterStats
): ComboResult {
  const steps = combo.steps.map((step): ComboStepResult => {
    const spell = findSpellByName(spells, step.spellName);
    if (!spell) {
      throw new Error(`Combo "${combo.name}" references unknown spell "${step.spellName}".`);
    }

    const damage = calculateSpellDamage(spell, stats, {
      baseDamageBonus: step.baseDamageBonus
    });

    return {
      label: step.label ?? spell.name,
      spellName: spell.name,
      casts: step.casts,
      note: step.note,
      baseDamageBonus: step.baseDamageBonus,
      damage,
      totalNormal: multiplyRange(damage.normal, step.casts),
      totalCrit: multiplyRange(damage.crit, step.casts),
      totalExpected: multiplyRange(damage.expected, step.casts),
      totalAp: damage.apCost * step.casts
    };
  });

  const totalExpected = sumRanges(steps.map((step) => step.totalExpected));
  const totalAp = sum(steps.map((step) => step.totalAp));

  return {
    comboId: combo.id,
    comboName: combo.name,
    steps,
    totalNormal: sumRanges(steps.map((step) => step.totalNormal)),
    totalCrit: sumRanges(steps.map((step) => step.totalCrit)),
    totalExpected,
    totalAp,
    expectedDamagePerAp: totalAp > 0 ? totalExpected.average / totalAp : 0,
    notes: [...new Set(steps.map((step) => step.note).filter((note): note is string => Boolean(note)))]
  };
}

function findSpellByName(spells: Spell[], spellName: string): Spell | undefined {
  const normalizedSpellName = normalizeName(spellName);
  return spells.find((spell) => normalizeName(spell.name) === normalizedSpellName);
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function multiplyRange(range: DamageRange, multiplier: number): DamageRange {
  return {
    min: range.min * multiplier,
    max: range.max * multiplier,
    average: range.average * multiplier
  };
}

function sumRanges(ranges: DamageRange[]): DamageRange {
  return {
    min: sum(ranges.map((range) => range.min)),
    max: sum(ranges.map((range) => range.max)),
    average: sum(ranges.map((range) => range.average))
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
