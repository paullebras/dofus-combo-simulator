# DofusDB API Notes

These notes document the parts of the DofusDB API used by this project.

The current goal is narrow: load Iop spells, normalize the damage lines from the latest grade available to a level 200 character, then feed them into a deterministic damage calculator. This document should evolve as the project uses more endpoints.

## Base URL

```text
https://api.dofusdb.fr
```

The current TypeScript client is in `src/dofusdb/client.ts`.

It automatically adds:

```text
lang=fr
```

unless another language is configured.

It also sends:

```text
Referer: dofus-combo-simulator
```

This follows the API creator's request to identify public projects through `headers.Referer`.

## Current Project Constants

```text
Iop breedId: 8
Expected class spell count: 44
POC character level: 200
Default language: fr
```

These values are centralized in `src/config.ts`.

## Response Shape

List endpoints may return either:

```ts
{
  data: T[];
}
```

or directly:

```ts
T[]
```

The current code supports both shapes.

## Localized Text

Fields such as `name` and `description` can be either:

```ts
string
```

or:

```ts
{
  fr?: string;
  en?: string;
  de?: string;
  es?: string;
  pt?: string;
}
```

Normalization rule:

1. Return the string directly if the field is already a string.
2. Prefer the requested language, currently `fr`.
3. Fall back to `en`.
4. Fall back to the first available localized value.
5. Return an empty string if nothing exists.

Implemented in `getLocalizedText`.

## Endpoints Used For The POC

### `/spell-variants`

Used to discover class spell IDs and variant relationships.

Example:

```text
GET /spell-variants?$skip=0&breedId=8&lang=fr
```

Important query params:

- `$skip`: pagination offset.
- `breedId`: class ID. The current POC uses Iop, which is `8`.
- `lang`: response language.

Observed useful fields:

```ts
{
  id: number;
  breedId: number;
  spellIds: number[];
  spells?: DofusDbSpell[];
}
```

Example relationship:

```ts
{
  breedId: 8,
  spellIds: [13115, 13138]
}
```

This means `13115` and `13138` are variants of each other, so the user should not be allowed to select both in the same build.

Current project behavior:

- Fetch variants with `breedId=8`.
- Extract spell IDs from `spellIds`.
- Page through all returned variant pairs. Classes currently have 22 variant pairs, which means 44 spells.
- Also tolerate older or alternate shapes such as `spellId`, `spell`, and `spells`.
- Store every other ID in the same variant pair as `variantSpellIds`.

### `/spells/{id}`

Used to fetch display-level spell data.

Example:

```text
GET /spells/13115?lang=fr
```

Observed useful fields:

```ts
{
  id: number;
  name: LocalizedText;
  description?: LocalizedText;
  iconId?: number;
  spellLevels?: number[];
  img?: string;
}
```

Current project usage:

- `id` becomes the spell ID.
- `name` becomes the display name.
- `img` is used as the icon URL.

Notes:

- `/spell-variants` can include embedded `spells`, but the project still fetches `/spells/{id}` directly so each spell can be normalized consistently.
- Some spell behavior is described in text, but the calculator should not parse damage from descriptions.

### `/spell-levels`

Used to fetch cast cost, critical chance, and effect lines for each spell grade.

Example:

```text
GET /spell-levels?spellId=13115&lang=fr
```

Important query params:

- `spellId`: DofusDB spell ID.
- `lang`: response language.

Observed useful fields:

```ts
{
  id: number;
  spellId: number;
  grade?: number;
  spellBreed?: number;
  apCost?: number;
  criticalHitProbability?: number;
  minPlayerLevel?: number;
  statesCriterion?: string;
  effects?: DofusDbEffect[];
  criticalEffect?: DofusDbEffect[];
}
```

Current project behavior:

- Treat `minPlayerLevel` as the character level where this spell grade is unlocked.
- For the level 200 POC, pick the latest spell grade available at or before character level 200.
- If no grade has `minPlayerLevel <= 200`, fall back to the highest available level by `minPlayerLevel` or `grade`.
- Use `apCost` as the spell AP cost.
- Convert `criticalHitProbability` from a whole percent to an internal ratio.
- Read normal damage lines from `effects`.
- Read critical damage lines from `criticalEffect`.

Observed note:

- The critical effect field is currently named `criticalEffect`, singular, but the code also tolerates `criticalEffects`.
- A spell can have one, two, or three grades depending on when it is unlocked and upgraded. For example, a spell unlocked at character level 80 and upgraded at 147 has two `/spell-levels` entries.

### `/stuffs/{id}`

Used to fetch a published DofusDB stuff/build.

Example:

```text
GET /stuffs/69f6a4074304cd0013621863?lang=fr
```

Observed useful fields:

```ts
{
  _id: string;
  name?: string;
  level?: number;
  stats?: Record<string, number>;
  base?: {
    strength?: number;
    intelligence?: number;
    chance?: number;
    agility?: number;
    vitality?: number;
    wisdom?: number;
  };
  parchment?: {
    strength?: number;
    intelligence?: number;
    chance?: number;
    agility?: number;
    vitality?: number;
    wisdom?: number;
  };
  breed?: {
    id?: number;
  };
}
```

The `stats` object is already aggregated by DofusDB and includes base, parchment, equipment, set bonuses, and forgemagie values.

Observed note:

- Final spell damage is exposed as stat `123` after the stuff is published.

Current calculator mapping:

```text
10 -> strength
13 -> chance
14 -> agility
15 -> intelligence
16 -> global flat damage
18 -> crit chance, whole percent
25 -> power
86 -> critical damage
87 -> critical flat resistance
88 -> earth damage
89 -> fire damage
90 -> water damage
91 -> air damage
92 -> neutral damage
123 -> spell final damage percent
```

Implemented in `src/dofusdb/stuffs.ts`.

### `/effects/{id}`

Used to inspect effect metadata and localized effect descriptions.

Example calls observed from the DofusDB website spell panel:

```text
GET /effects/98?lang=fr
GET /effects/1013?lang=fr
```

Observed useful fields:

```ts
{
  id: number;
  elementId?: number;
  useDice?: boolean;
  forceMinMax?: boolean;
  effectPowerRate?: number;
  description?: LocalizedText;
}
```

Examples:

- `98`: Air damage.
- `1013`: Air damage based on remaining MP.

These endpoints explain effect semantics. They do not appear to return stuff-adjusted spell damage directly.

## Effects And Damage Lines

Spell levels contain many effects. Not every effect is damage.

Observed effect fields:

```ts
{
  effectId?: number;
  effectElement?: number;
  targetMask?: string;
  diceNum?: number;
  diceSide?: number;
  value?: number;
  description?: LocalizedText;
}
```

Current damage-line rule:

- `effectElement` must map to a known element.
- Summon-only target masks, currently observed as `J,j`, are ignored for the naked dummy target.
- `diceNum` must be a positive number.
- `diceSide` must be a positive number.

Then:

- `diceNum` is the minimum base damage.
- `diceSide` is the maximum base damage.
- The matching critical line is selected by filtered damage-line order.

Known target-mask behavior:

- `J,j` was observed on the summon-only extra damage line for `Concentration`.
- The current POC ignores summon-only damage for the naked dummy target.

Example:

```ts
{
  effectElement: 2,
  diceNum: 17,
  diceSide: 19
}
```

Normalizes to:

```ts
{
  element: "fire",
  normalMin: 17,
  normalMax: 19
}
```

## Element Mapping

Observed mapping used by the current normalizer:

```text
1 -> earth
2 -> fire
3 -> water
4 -> air
5 -> neutral
```

Notes:

- This mapping is based on observed Iop spell payloads.
- Older or alternate payloads may use `elementId` or `characteristic`, so the normalizer checks those fields after `effectElement`.
- Effects with `effectElement = -1` are currently treated as non-elemental and ignored by the damage calculator.

## Critical Hits

DofusDB gives separate critical effect lines.

This is important:

```text
Critical damage is not a multiplier.
```

For a spell damage line:

- Normal base damage comes from `effects`.
- Critical base damage comes from `criticalEffect`.
- If a critical line is missing, the calculator falls back to the normal base values.

Critical chance values from DofusDB are whole percentages, such as:

```text
10 means 10%
25 means 25%
```

The calculator uses ratios internally:

```text
10% -> 0.10
25% -> 0.25
```

Critical chance is currently:

```text
spell base crit chance + user crit chance
```

clamped between `0` and `1`.

For the POC, negative critical chance is ignored. Dofus can represent negative critical chance, but it is outside the current scope.

## Special Conditions

Some spells have behavior that is not represented as a simple damage line.

Examples:

- Charge scaling.
- State requirements.
- Per-target or per-turn cast constraints.
- Buffs on the caster.
- Delayed effects.
- Movement or positioning effects.

For the POC, these should not block the base calculator. The current behavior is:

- Include simple elemental damage lines.
- Ignore non-damage effects.
- Keep fields such as `statesCriterion` available for future work.
- Document special spells separately when we decide how to model them.

Currently modeled combo-specific base damage bonuses:

- `Accumulation` charged: `+24` base damage from effect `293`.
- `Colere de Iop` charged recovery hit: `+110` base damage from effect `293`.

These bonuses are applied in the combo definition, not globally on the spell, because they depend on combo state.

## Known POC Limitations

The current normalizer is intentionally conservative.

It can calculate straightforward elemental damage spells, but it does not yet fully model:

- Pushback damage.
- Buffed future casts.
- Charge-based spells.
- Conditional extra lines.
- Damage based on target state.
- Damage based on caster state.
- Effects encoded only through scripts or descriptions.

Spells with no simple elemental damage line may currently show `0` damage. That does not always mean the spell is useless; it means the current deterministic model does not support that effect yet.

## Rounding Status

The formula currently produces decimal damage values very close to the DofusDB website.

Observed examples for `Iop Terre basique`:

```text
Concentration normal: ours 494.624-570.6688, DofusDB 495-571
Pression normal: ours 608.6912-684.736, DofusDB 608-684
Colere de Iop normal: ours 1654.3072-2015.52, DofusDB 1655-2016
```

This suggests Dofus/DofusDB display rounding is not a single simple `round`, `floor`, or `ceil` over the final decimal value. Keep raw calculation logic separate from display rounding until the exact rule is confirmed.

## PowerShell Note

When testing URLs manually in PowerShell, `$skip` can be interpreted as a variable if the URL is inside double quotes.

Prefer one of these:

```powershell
node -e 'const u = new URL("https://api.dofusdb.fr/spell-variants"); u.searchParams.set("$skip", "0");'
```

or escape the `$` with a PowerShell backtick when needed.

The TypeScript client avoids this issue by using `URLSearchParams`.

## Related Project Files

- `src/config.ts`: DofusDB constants.
- `src/dofusdb/client.ts`: small API client.
- `src/dofusdb/types.ts`: observed DofusDB payload types.
- `src/dofusdb/normalizers.ts`: localization, crit chance, element mapping.
- `src/dofusdb/classSpells.ts`: class spell loading and spell normalization.
- `src/calculator/damage.ts`: deterministic damage calculation.
- `doc/iop-damage-calculator-poc.md`: POC product and calculation plan.
- `doc/routes.txt`: raw route list.
- `doc/urls.txt`: useful request examples.
