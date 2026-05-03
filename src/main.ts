import { calculateSpellDamage } from "./calculator/damage.js";
import { calculateComboDamage } from "./calculator/combo.js";
import { getCombo } from "./combos/registry.js";
import { EXPECTED_CLASS_SPELL_COUNT, IOP_BREED_ID } from "./config.js";
import { fetchClassSpells } from "./dofusdb/classSpells.js";
import { fetchStuff, mapStuffToCasterStats } from "./dofusdb/stuffs.js";
import type { DofusDbStuff } from "./dofusdb/types.js";
import type { CasterStats } from "./domain/stats.js";
import { NAKED_LEVEL_200_CASTER_STATS } from "./domain/stats.js";

const stuffId = getArgumentValue("--stuff");
const comboId = getArgumentValue("--combo");
const compareStuffIds = getArgumentValue("--compare-stuffs")
  ?.split(",")
  .map((id) => id.trim())
  .filter(Boolean) ?? [];

const spells = await fetchClassSpells(IOP_BREED_ID);

if (spells.length !== EXPECTED_CLASS_SPELL_COUNT) {
  console.warn(`Expected ${EXPECTED_CLASS_SPELL_COUNT} class spells, got ${spells.length}.`);
}

console.log(`Loaded ${spells.length} Iop spells.`);

if (comboId) {
  const combo = getCombo(comboId);
  if (!combo) {
    throw new Error(`Unknown combo "${comboId}".`);
  }

  const stuffIds = compareStuffIds.length > 0
    ? compareStuffIds
    : stuffId
      ? [stuffId]
      : [];

  if (stuffIds.length > 0) {
    const contexts = await Promise.all(stuffIds.map(loadStuffContext));
    printComboComparison(combo.name, contexts.map((context) => ({
      label: context.stuff.name ?? context.stuff._id,
      result: calculateComboDamage(combo, spells, context.stats)
    })));
  } else {
    printComboComparison(combo.name, [{
      label: "Naked level 200 baseline",
      result: calculateComboDamage(combo, spells, NAKED_LEVEL_200_CASTER_STATS)
    }]);
  }
} else {
  const casterStats = stuffId
    ? mapStuffToCasterStats(await fetchStuff(stuffId))
    : NAKED_LEVEL_200_CASTER_STATS;

  if (stuffId) {
    console.log(`Using DofusDB stuff ${stuffId}.`);
  } else {
    console.log("Using naked level 200 baseline stats.");
  }

  printSpellTable(casterStats);
}

function printSpellTable(casterStats: CasterStats): void {
  const results = spells
    .map((spell) => calculateSpellDamage(spell, casterStats))
    .sort((a, b) => b.damagePerAp - a.damagePerAp);

  console.table(
    results.map((result) => ({
      spell: result.spellName,
      ap: result.apCost,
      normalMin: Math.round(result.normal.min),
      normalMax: Math.round(result.normal.max),
      normalAvg: Math.round(result.normal.average),
      critMin: Math.round(result.crit.min),
      critMax: Math.round(result.crit.max),
      critAvg: Math.round(result.crit.average),
      expectedMin: Math.round(result.expected.min),
      expectedMax: Math.round(result.expected.max),
      expectedAvg: Math.round(result.expected.average),
      damagePerAp: Math.round(result.damagePerAp)
    }))
  );
}

async function loadStuffContext(stuffIdToLoad: string): Promise<{
  stuff: DofusDbStuff;
  stats: CasterStats;
}> {
  const stuff = await fetchStuff(stuffIdToLoad);
  return {
    stuff,
    stats: mapStuffToCasterStats(stuff)
  };
}

function printComboComparison(
  comboName: string,
  comparisons: Array<{
    label: string;
    result: ReturnType<typeof calculateComboDamage>;
  }>
): void {
  console.log(`Combo: ${comboName}`);

  console.table(
    comparisons.map(({ label, result }) => ({
      stuff: label,
      totalAp: result.totalAp,
      expectedMin: Math.round(result.totalExpected.min),
      expectedMax: Math.round(result.totalExpected.max),
      expectedAvg: Math.round(result.totalExpected.average),
      expectedPerAp: Math.round(result.expectedDamagePerAp)
    }))
  );

  for (const { label, result } of comparisons) {
    console.log(`\n${label}`);
    console.table(
      result.steps.map((step) => ({
        step: step.label,
        casts: step.casts,
        baseBonus: step.baseDamageBonus ?? 0,
        apPerCast: step.damage.apCost,
        normalMin: Math.round(step.damage.normal.min),
        normalMax: Math.round(step.damage.normal.max),
        critMin: Math.round(step.damage.crit.min),
        critMax: Math.round(step.damage.crit.max),
        expectedAvg: Math.round(step.damage.expected.average)
      }))
    );

    if (result.notes.length > 0) {
      console.warn(`Notes: ${result.notes.join(" ")}`);
    }
  }
}

function getArgumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
