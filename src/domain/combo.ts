export type ComboStep = {
  label?: string;
  spellName: string;
  casts: number;
  baseDamageBonus?: number;
  note?: string;
};

export type Combo = {
  id: string;
  name: string;
  steps: ComboStep[];
};
