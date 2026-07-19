const VULGAR: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** Portion counts for display: quarter fractions become vulgar glyphs (0.5→"½", 1.5→"1½"), whole
 *  numbers stay bare, and anything else renders as a comma decimal ("1,25") to match how the app's
 *  locale writes numbers. Stored portions are already rounded to 2 decimals (normalizePortions). */
export function formatPortions(n: number): string {
	const whole = Math.floor(n);
	const frac = Math.round((n - whole) * 100) / 100;
	const glyph = VULGAR[String(frac)];
	if (glyph) return whole === 0 ? glyph : `${whole}${glyph}`;
	if (frac === 0) return String(whole);
	return String(n).replace('.', ',');
}

/** Editable-text form for prefilling a decimal input: comma separator, no vulgar glyphs (1.5→"1,5"). */
export function formatDecimalInput(n: number): string {
	return String(n).replace('.', ',');
}

/** "½ portion", "1 portion", "1½ portions" — singular up to and including 1, plural above. */
export function formatPortionsPhrase(n: number, base: string): string {
	return `${formatPortions(n)} ${n > 1 ? `${base}s` : base}`;
}
