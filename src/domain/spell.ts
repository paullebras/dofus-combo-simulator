import type { DamageElement } from "./elements.js";

export type SpellDamageLine = {
  element: DamageElement;
  normalMin: number;
  normalMax: number;
  critMin?: number;
  critMax?: number;
  condition?: string;
};

export type Spell = {
  id: number;
  name: string;
  icon?: string;
  variantSpellIds: number[];
  apCost: number;
  baseCritChance: number;
  damageLines: SpellDamageLine[];
};
