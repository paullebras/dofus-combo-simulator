import { POC_CHARACTER_LEVEL } from "../config.js";
import type { Spell, SpellDamageLine } from "../domain/spell.js";
import { DofusDbClient } from "./client.js";
import { getLocalizedText, mapEffectToElement, normalizeCritChance, uniqueNumbers } from "./normalizers.js";
import type { DofusDbEffect, DofusDbListResponse, DofusDbSpell, DofusDbSpellLevel, DofusDbSpellVariant } from "./types.js";

type DamageEffect = DofusDbEffect & {
  diceNum: number;
  diceSide: number;
};

export async function fetchClassSpells(
  breedId: number,
  client = new DofusDbClient()
): Promise<Spell[]> {
  const variants = await fetchClassSpellVariants(client, breedId);
  const spellIds = uniqueNumbers(
    variants.flatMap((variant) => [
      variant.spellId,
      ...(variant.spellIds ?? []),
      variant.spell?.id,
      ...(variant.spells?.map((spell) => spell.id) ?? [])
    ])
  );

  return Promise.all(spellIds.map((spellId) => fetchSpell(client, spellId, variants)));
}

async function fetchClassSpellVariants(
  client: DofusDbClient,
  breedId: number
): Promise<DofusDbSpellVariant[]> {
  const pageSize = 10;
  const variants: DofusDbSpellVariant[] = [];
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;

  while (skip < total) {
    const response = await client.get<DofusDbListResponse<DofusDbSpellVariant> | DofusDbSpellVariant[]>(
      "/spell-variants",
      {
        "$skip": skip,
        breedId
      }
    );

    if (Array.isArray(response)) {
      return response;
    }

    const page = response.data ?? [];
    variants.push(...page);

    total = response.total ?? variants.length;
    skip += response.limit ?? page.length ?? pageSize;

    if (page.length === 0) {
      break;
    }
  }

  return variants;
}

async function fetchSpell(
  client: DofusDbClient,
  spellId: number,
  variants: DofusDbSpellVariant[]
): Promise<Spell> {
  const [spell, levelsResponse] = await Promise.all([
    client.get<DofusDbSpell>(`/spells/${spellId}`),
    client.get<DofusDbListResponse<DofusDbSpellLevel> | DofusDbSpellLevel[]>("/spell-levels", { spellId })
  ]);

  const levels = Array.isArray(levelsResponse) ? levelsResponse : levelsResponse.data ?? [];
  const spellLevel = pickLatestSpellLevelForCharacterLevel(levels, POC_CHARACTER_LEVEL);

  return {
    id: spell.id,
    name: getLocalizedText(spell.name),
    icon: spell.icon ?? spell.img,
    variantSpellIds: getVariantSpellIds(spellId, variants),
    apCost: spellLevel?.apCost ?? 0,
    baseCritChance: normalizeCritChance(spellLevel?.criticalHitProbability),
    damageLines: getDamageLines(spellLevel)
  };
}

function pickLatestSpellLevelForCharacterLevel(
  levels: DofusDbSpellLevel[],
  characterLevel: number
): DofusDbSpellLevel | undefined {
  const availableLevels = levels.filter((level) => (level.minPlayerLevel ?? 0) <= characterLevel);

  return sortSpellLevelsByUnlockLevelDesc(availableLevels)[0]
    ?? sortSpellLevelsByUnlockLevelDesc(levels)[0];
}

function sortSpellLevelsByUnlockLevelDesc(levels: DofusDbSpellLevel[]): DofusDbSpellLevel[] {
  return [...levels].sort((a, b) => (b.minPlayerLevel ?? b.grade ?? 0) - (a.minPlayerLevel ?? a.grade ?? 0));
}

function getVariantSpellIds(spellId: number, variants: DofusDbSpellVariant[]): number[] {
  const pair = variants.find((variant) => {
    const ids = uniqueNumbers([
      variant.spellId,
      ...(variant.spellIds ?? []),
      variant.spell?.id,
      ...(variant.spells?.map((spell) => spell.id) ?? [])
    ]);

    return ids.includes(spellId);
  });

  if (!pair) {
    return [];
  }

  return uniqueNumbers([
    pair.spellId,
    ...(pair.spellIds ?? []),
    pair.spell?.id,
    ...(pair.spells?.map((spell) => spell.id) ?? [])
  ]).filter((id) => id !== spellId);
}

function getDamageLines(level: DofusDbSpellLevel | undefined): SpellDamageLine[] {
  if (!level) {
    return [];
  }

  const effects = (level.effects ?? []).filter(isDamageEffect);
  const critEffects = (level.criticalEffects ?? level.criticalEffect ?? []).filter(isDamageEffect);

  return effects
    .map((effect, index): SpellDamageLine | null => {
      const element = mapEffectToElement(effect);
      if (!element) {
        return null;
      }

      const critEffect = critEffects[index];

      return {
        element,
        normalMin: effect.diceNum,
        normalMax: effect.diceSide ?? effect.diceNum,
        critMin: critEffect?.diceNum,
        critMax: critEffect?.diceSide ?? critEffect?.diceNum,
        condition: getLocalizedText(effect.description) || undefined
      };
    })
    .filter((line): line is SpellDamageLine => line !== null);
}

function isDamageEffect(effect: DofusDbEffect): effect is DamageEffect {
  return mapEffectToElement(effect) !== null
    && !isSummonOnlyTarget(effect.targetMask)
    && typeof effect.diceNum === "number"
    && typeof effect.diceSide === "number"
    && effect.diceNum > 0
    && effect.diceSide > 0;
}

function isSummonOnlyTarget(targetMask: string | undefined): boolean {
  if (!targetMask) {
    return false;
  }

  const masks = targetMask.split(",").map((mask) => mask.trim()).filter(Boolean);
  return masks.length > 0 && masks.every((mask) => mask === "J" || mask === "j");
}
