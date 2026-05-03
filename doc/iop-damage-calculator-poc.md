# Iop Damage Calculator POC

## Goal

Build a proof-of-concept damage calculator for the Dofus Iop class at level 200, using the DofusDB API.

The goal is to compare the theoretical efficiency of equipment, not to simulate full combat.

Current implementation is still Iop-focused, but the spell loader already accepts a variable class `breedId` so the project can later support every class.

## Scope

- Only Iop spells are considered.
- Iop `breedId` is `8`.
- For each spell, use the latest spell grade available to a level 200 character.
- The user inputs raw stats manually.
- The target is always a naked dummy with `0` resistances.
- For naked level 200 formula tests, assume permanent characteristic scrolls: `100` strength, `100` intelligence, `100` chance, and `100` agility.

## Out of Scope

Ignore the following for this POC:

- Range.
- Line of sight.
- Cooldowns.
- Positioning.
- Combat constraints.
- Target resistances.
- Buffs and debuffs over time.
- Cast limits.
- Complex spell states beyond simple detectable conditions.

## API Data

Use the DofusDB API. Do not scrape pages for spell data.

Required endpoints:

- `/spell-variants?breedId=8`
- `/spells/{id}`
- `/spell-levels?spellId={id}`
- `/stuffs/{id}`
- `/effects/{id}` for effect metadata and descriptions when needed.

See `doc/dofusdb-api.md` for observed payload shapes and normalization notes.

For each spell, collect:

- Spell ID.
- Name.
- Icon.
- Variant relationship.
- AP cost.
- Base critical hit chance.
- Damage lines from the latest grade available at character level 200.
- Normal minimum and maximum base damage.
- Critical minimum and maximum base damage.
- Damage element.
- Special conditions, such as charges, states, or scaling rules.

For published DofusDB stuffs, use the aggregated `stats` object from `/stuffs/{id}`. It includes base stats, parchments, equipment, set bonuses, forgemagie, and final spell damage percent when published.

## User Inputs

The user manually provides:

- Strength.
- Intelligence.
- Chance.
- Agility.
- Power.
- Global flat damage.
- Elemental flat damage.
- Critical damage.
- Critical chance, entered by users as a whole percent from `0` to `100`, then converted internally to a ratio such as `0.25`.
- Optional final damage percentage.

For the naked level 200 baseline used to test the formula:

- Strength: `100`.
- Intelligence: `100`.
- Chance: `100`.
- Agility: `100`.
- Power: `0`.
- Flat damage: `0`.
- Critical damage: `0`.
- Critical chance: `0`.

## Damage Model

Each damage line must be computed separately.

```text
Damage = Base x (1 + (stat + power) / 100)
       + flat damage
       + elemental damage
       + critical damage, if critical
```

If final spell damage is present, apply it after the base formula:

```text
FinalDamage = Damage x (1 + finalDamagePercent / 100)
```

Critical hits are not a multiplier. They use separate critical base damage values from the API.

For each damage line:

- Compute normal minimum, maximum, and average damage.
- Compute critical minimum, maximum, and average damage.
- Compute expected minimum, maximum, and average damage.

```text
Expected = normalAverage x (1 - critChance)
         + critAverage x critChance
```

Then aggregate all damage lines for the spell.

Known detail: our raw decimal results are very close to DofusDB, but display values can differ by `1` because Dofus/DofusDB rounding rules are not fully identified yet.

## Important Design Constraints

- Use the API, not scraping.
- `/spell-variants` gives variant relationships.
- `/spells` and `/spell-levels` provide spell details and damage data.
- Multi-line damage is critical.
- Each damage line must be calculated independently.
- Critical damage is based on critical base values, not a multiplier.
- Variants must be enforced: the user cannot select both spells in a variant pair.
- Damage per AP is essential for comparing efficiency.

## Minimal Output

For each spell, display:

- Spell name.
- Normal damage minimum, maximum, and average.
- Critical damage minimum, maximum, and average.
- Expected damage minimum, maximum, and average.
- Damage per AP.

## Registered Combos

### basic combo #1

Current combo definition:

| Spell | Casts | Note |
| --- | ---: | --- |
| Concentration | 5 |  |
| Pression | 1 |  |
| Accumulation | 6 | Charged with `+24` base damage from DofusDB effect `293`. |
| Colere de Iop | 1 | Registered as `Colere 1`, uncharged. |
| Colere de Iop | 1 | Registered as `Colere 2`, charged with `+110` base damage from DofusDB effect `293`. |

The combo is available as `basic-combo-1` in `src/combos/registry.ts`.

The combo comparison output shows:

- Total combo expected damage per stuff.
- Per-spell normal min/max.
- Per-spell critical min/max.
- Per-spell expected average.

## TODO

- Confirm Dofus/DofusDB integer rounding rules for displayed damage. Current discrepancies are small, usually `1` damage.
- Add a validation script that compares selected spell normal/critical ranges against manually recorded DofusDB website values.
- Improve display labels for charged spell states and accents, such as `Colere` -> `Colere/Colère` consistently.
- Model more special spell conditions as they appear in real combos.
- Decide how to represent target assumptions explicitly, such as dummy, summon, enemy, or state-specific target.
- Add tests for stat mapping from `/stuffs/{id}`, especially final spell damage stat `123` and critical damage stat `86`.

## Final Takeaway

This is not a combat simulator.

This is a deterministic damage evaluator:

```text
Input: user stats + spell data
Output: expected damage efficiency
```

That is enough to compare gear effectively for a proof of concept.
