/**
 * Stock and packaging unit formatting utility.
 */

export function isPackagedUnit(unit?: string): boolean {
  if (!unit) return false;
  const u = unit.trim();
  return [
    "Packets",
    "Packet",
    "Boxes",
    "Box",
    "Cartons",
    "Carton",
    "Dozens",
    "Dozen",
    "Pairs",
    "Pair",
    "Sets",
    "Set",
  ].includes(u);
}

export function getDefaultPackSize(
  unit?: string,
  customPackSize?: number | null,
): number {
  if (!unit) return customPackSize && customPackSize > 0 ? customPackSize : 1;
  const u = unit.trim();
  if (u === "Dozens" || u === "Dozen") return 12;
  if (u === "Pairs" || u === "Pair") return 2;
  if (customPackSize && customPackSize > 0) return customPackSize;
  return 1;
}

export function formatUnitLabel(unit?: string): string {
  if (!unit) return "Pieces";
  if (unit === "Kilograms" || unit === "Kilogram" || unit === "KG") return "KG";
  return unit;
}

/**
 * Format quantity according to product unit and packaging size.
 * Examples:
 * - Sugar: "689.5 KG"
 * - Cartons: "3 Cartons 18 Pcs", "5 Cartons", "12 Pcs"
 * - Dozens: "4 Dozens 6 Pcs", "2 Dozens"
 */
export function formatStock(
  quantity: number | string | undefined | null,
  unit?: string,
  packSize?: number | null,
): string {
  const num = Number(quantity ?? 0);
  if (isNaN(num)) return "0";

  const u = (unit || "Pieces").trim();

  // Kilograms / KG
  if (u === "Kilograms" || u === "Kilogram" || u === "KG") {
    return `${parseFloat(num.toFixed(3))} KG`;
  }

  const effectivePackSize = getDefaultPackSize(u, packSize);

  if (effectivePackSize > 1) {
    // Check if there is a fractional piece remainder
    const wholePacks = Math.floor(Math.abs(num));
    const remainder = Math.abs(num) - wholePacks;
    const loose = Math.round(remainder * effectivePackSize);

    // If loose rounds to effectivePackSize (e.g. 11.999 -> 12)
    const adjustedPacks =
      loose === effectivePackSize ? wholePacks + 1 : wholePacks;
    const adjustedLoose = loose === effectivePackSize ? 0 : loose;
    const sign = num < 0 ? "-" : "";

    if (adjustedLoose === 0) {
      return `${sign}${adjustedPacks} ${formatUnitLabel(u)}`;
    }
    if (adjustedPacks === 0) {
      return `${sign}${adjustedLoose} Pcs`;
    }
    return `${sign}${adjustedPacks} ${formatUnitLabel(u)} ${adjustedLoose} Pcs`;
  }

  if (num % 1 !== 0) {
    return `${parseFloat(num.toFixed(3))} ${formatUnitLabel(u)}`;
  }
  return `${num} ${formatUnitLabel(u)}`;
}
