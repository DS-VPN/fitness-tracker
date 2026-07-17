/** Accepts either "." or "," as the decimal separator (comma is standard in many locales, e.g. Norwegian) and
 *  any precision — falls back to 0 for anything unparseable, matching how empty/partial input should behave
 *  while the user is still typing. */
export function parseDecimal(raw: string): number {
	const n = Number(raw.trim().replace(',', '.'));
	return Number.isFinite(n) ? n : 0;
}
