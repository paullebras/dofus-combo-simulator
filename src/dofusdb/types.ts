export type LocalizedText = string | Record<string, string | undefined>;

export type DofusDbListResponse<T> = {
  total?: number;
  limit?: number;
  skip?: number;
  data?: T[];
};

export type DofusDbSpellVariant = {
  id?: number;
  spellId?: number;
  spellIds?: number[];
  spell?: { id?: number };
  spells?: Array<{ id?: number }>;
};

export type DofusDbSpell = {
  id: number;
  name?: LocalizedText;
  img?: string;
  icon?: string;
};

export type DofusDbSpellLevel = {
  id?: number;
  spellId?: number;
  grade?: number;
  minPlayerLevel?: number;
  apCost?: number;
  criticalHitProbability?: number;
  effects?: DofusDbEffect[];
  criticalEffect?: DofusDbEffect[];
  criticalEffects?: DofusDbEffect[];
};

export type DofusDbEffect = {
  effectId?: number;
  characteristic?: number;
  elementId?: number;
  effectElement?: number;
  targetMask?: string;
  diceNum?: number;
  diceSide?: number;
  value?: number;
  description?: LocalizedText;
};

export type DofusDbStuff = {
  _id: string;
  name?: string;
  level?: number;
  stats?: Record<string, number>;
  base?: {
    vitality?: number;
    strength?: number;
    intelligence?: number;
    agility?: number;
    chance?: number;
    wisdom?: number;
  };
  parchment?: {
    vitality?: number;
    strength?: number;
    intelligence?: number;
    agility?: number;
    chance?: number;
    wisdom?: number;
  };
  breed?: {
    id?: number;
    shortName?: LocalizedText;
  };
};
