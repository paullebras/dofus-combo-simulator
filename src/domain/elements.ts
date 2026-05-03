export type DamageElement = "neutral" | "earth" | "fire" | "water" | "air";

export function getElementStatKey(element: DamageElement): "strength" | "intelligence" | "chance" | "agility" {
  switch (element) {
    case "neutral":
    case "earth":
      return "strength";
    case "fire":
      return "intelligence";
    case "water":
      return "chance";
    case "air":
      return "agility";
  }
}
