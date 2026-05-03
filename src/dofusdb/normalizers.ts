import type { DamageElement } from "../domain/elements.js";
import type { LocalizedText } from "./types.js";

export function getLocalizedText(value: LocalizedText | undefined, language = "fr"): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] ?? value.en ?? Object.values(value).find(Boolean) ?? "";
}

export function uniqueNumbers(values: Array<number | undefined>): number[] {
  return [...new Set(values.filter((value): value is number => typeof value === "number"))];
}

export function normalizeCritChance(rawChance: number | undefined): number {
  if (!rawChance) {
    return 0;
  }

  return rawChance > 1 ? rawChance / 100 : rawChance;
}

export function mapEffectToElement(effect: {
  effectElement?: number;
  elementId?: number;
  characteristic?: number;
}): DamageElement | null {
  switch (effect.effectElement ?? effect.elementId ?? effect.characteristic) {
    case 1:
      return "earth";
    case 2:
      return "fire";
    case 3:
      return "water";
    case 4:
      return "air";
    case 5:
      return "neutral";
    default:
      return null;
  }
}
