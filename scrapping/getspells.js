const BREED_ID = 8; // IOP

const variantsUrl = `https://api.dofusdb.fr/spell-variants?$skip=0&breedId=${BREED_ID}&lang=fr`;

function getName(obj) {
  if (!obj?.name) return null;
  if (typeof obj.name === "string") return obj.name;
  return obj.name.fr ?? obj.name.en ?? null;
}

const variantsRes = await fetch(variantsUrl);
const variantsJson = await variantsRes.json();

const variants = variantsJson.data ?? variantsJson;

const spellIds = [
  ...new Set(
    variants.flatMap(v => [
      v.spellId,
      ...(v.spellIds ?? []),
      v.spell?.id,
      ...(v.spells?.map(s => s.id) ?? [])
    ]).filter(Boolean)
  )
];

const spells = [];

for (const id of spellIds) {
  const res = await fetch(`https://api.dofusdb.fr/spells/${id}?lang=fr`);
  const spell = await res.json();

  spells.push({
    id,
    name: getName(spell)
  });
}

// console.table(spells);
// console.log(JSON.stringify(spells, null, 2));
console.dir(variants[0], { depth: null });