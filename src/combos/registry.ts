import type { Combo } from "../domain/combo.js";

export const BASIC_COMBO_1: Combo = {
  id: "basic-combo-1",
  name: "basic combo #1",
  steps: [
    {
      spellName: "Concentration",
      casts: 5
    },
    {
      spellName: "Pression",
      casts: 1
    },
    {
      label: "Accumulation (chargees)",
      spellName: "Accumulation",
      casts: 6,
      baseDamageBonus: 24
    },
    {
      label: "Colere 1",
      spellName: "Colere de Iop",
      casts: 1
    },
    {
      label: "Colere 2",
      spellName: "Colere de Iop",
      casts: 1,
      baseDamageBonus: 110
    }
  ]
};

export const COMBOS: Combo[] = [
  BASIC_COMBO_1
];

export function getCombo(comboIdOrName: string): Combo | undefined {
  const normalizedInput = normalizeName(comboIdOrName);

  return COMBOS.find((combo) =>
    normalizeName(combo.id) === normalizedInput
    || normalizeName(combo.name) === normalizedInput
  );
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
