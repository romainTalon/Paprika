/**
 * Fraction Parser Utility
 *
 * Parses various fraction formats into decimal numbers
 * Supports: "1/2", "3/4", "1 1/2", "0.5", "2", "½", "¼", "¾"
 */

/**
 * Parse a fraction string into a decimal number
 *
 * @param input - The input string to parse
 * @returns The decimal value, or null if invalid
 *
 * @example
 * parseFraction("1/2")      // 0.5
 * parseFraction("3/4")      // 0.75
 * parseFraction("1 1/2")    // 1.5
 * parseFraction("2")        // 2
 * parseFraction("0.5")      // 0.5
 * parseFraction("½")        // 0.5
 * parseFraction("invalid")  // null
 */
export function parseFraction(input: string): number | null {
  if (!input || input.trim() === "") {
    return null;
  }

  const trimmed = input.trim();

  // Replace unicode fractions with ASCII equivalents
  const normalized = trimmed
    .replace(/½/g, "1/2")
    .replace(/⅓/g, "1/3")
    .replace(/⅔/g, "2/3")
    .replace(/¼/g, "1/4")
    .replace(/¾/g, "3/4")
    .replace(/⅕/g, "1/5")
    .replace(/⅖/g, "2/5")
    .replace(/⅗/g, "3/5")
    .replace(/⅘/g, "4/5")
    .replace(/⅙/g, "1/6")
    .replace(/⅚/g, "5/6")
    .replace(/⅐/g, "1/7")
    .replace(/⅛/g, "1/8")
    .replace(/⅜/g, "3/8")
    .replace(/⅝/g, "5/8")
    .replace(/⅞/g, "7/8");

  // Pattern 1: Simple decimal (e.g., "2.5", "0.5")
  if (/^\d+\.?\d*$/.test(normalized)) {
    const num = parseFloat(normalized);
    return !isNaN(num) && num >= 0 ? num : null;
  }

  // Pattern 2: Simple fraction (e.g., "1/2", "3/4")
  const simpleFractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (simpleFractionMatch) {
    const numerator = parseInt(simpleFractionMatch[1], 10);
    const denominator = parseInt(simpleFractionMatch[2], 10);

    if (denominator === 0) return null; // Division by zero
    const result = numerator / denominator;
    return !isNaN(result) && result >= 0 ? result : null;
  }

  // Pattern 3: Mixed number (e.g., "1 1/2", "2 3/4")
  const mixedNumberMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedNumberMatch) {
    const whole = parseInt(mixedNumberMatch[1], 10);
    const numerator = parseInt(mixedNumberMatch[2], 10);
    const denominator = parseInt(mixedNumberMatch[3], 10);

    if (denominator === 0) return null; // Division by zero
    const fraction = numerator / denominator;
    const result = whole + fraction;
    return !isNaN(result) && result >= 0 ? result : null;
  }

  // Invalid format
  return null;
}

/**
 * Format a decimal number as a fraction string (for display)
 *
 * @param value - The decimal value
 * @returns The fraction string representation
 *
 * @example
 * formatFraction(0.5)   // "1/2"
 * formatFraction(0.75)  // "3/4"
 * formatFraction(1.5)   // "1 1/2"
 * formatFraction(2)     // "2"
 */
export function formatFraction(value: number): string {
  if (!isFinite(value) || value < 0) {
    return String(value);
  }

  // If it's a whole number, return as is
  if (Number.isInteger(value)) {
    return String(value);
  }

  const whole = Math.floor(value);
  const decimal = value - whole;

  // Common fractions lookup table
  const fractions: Record<string, string> = {
    "0.125": "1/8",
    "0.167": "1/6",
    "0.2": "1/5",
    "0.25": "1/4",
    "0.333": "1/3",
    "0.375": "3/8",
    "0.4": "2/5",
    "0.5": "1/2",
    "0.6": "3/5",
    "0.625": "5/8",
    "0.667": "2/3",
    "0.75": "3/4",
    "0.8": "4/5",
    "0.833": "5/6",
    "0.875": "7/8",
  };

  // Round decimal to 3 decimal places for lookup
  const roundedDecimal = Math.round(decimal * 1000) / 1000;
  const fractionStr = fractions[String(roundedDecimal)];

  if (fractionStr) {
    return whole > 0 ? `${whole} ${fractionStr}` : fractionStr;
  }

  // If no common fraction found, return decimal
  return String(value);
}
