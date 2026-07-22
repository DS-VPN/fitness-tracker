// Shared, dependency-free peptide domain constants + formatting. Pure — safe on client and server.
// Dose is stored canonically in micrograms (mcg) everywhere; conversion to mg is display-only.

export type PeptideCategory = 'glp1' | 'healing' | 'gh_secretagogue' | 'other';

export const PEPTIDE_CATEGORIES: { value: PeptideCategory; label: string }[] = [
	{ value: 'glp1', label: 'GLP-1 agonist' },
	{ value: 'healing', label: 'Healing / recovery' },
	{ value: 'gh_secretagogue', label: 'GH secretagogue' },
	{ value: 'other', label: 'Other' }
];

export function categoryLabel(c: PeptideCategory | null | undefined): string {
	return PEPTIDE_CATEGORIES.find((x) => x.value === c)?.label ?? 'Uncategorized';
}

export function isPeptideCategory(v: unknown): v is PeptideCategory {
	return typeof v === 'string' && PEPTIDE_CATEGORIES.some((x) => x.value === v);
}

export type InjectionRoute = 'subq' | 'im';
export const ROUTE_LABELS: Record<InjectionRoute, string> = {
	subq: 'Subcutaneous',
	im: 'Intramuscular'
};
export function isInjectionRoute(v: unknown): v is InjectionRoute {
	return v === 'subq' || v === 'im';
}

/** Injection sites for rotation, ordered top→bottom / left→right for the body-map picker. */
export type InjectionSite =
	| 'abdomen_l'
	| 'abdomen_r'
	| 'love_handle_l'
	| 'love_handle_r'
	| 'thigh_l'
	| 'thigh_r'
	| 'delt_l'
	| 'delt_r'
	| 'glute_l'
	| 'glute_r';

export const INJECTION_SITES: { value: InjectionSite; label: string; region: string }[] = [
	{ value: 'delt_l', label: 'Left delt', region: 'Delt' },
	{ value: 'delt_r', label: 'Right delt', region: 'Delt' },
	{ value: 'abdomen_l', label: 'Left abdomen', region: 'Abdomen' },
	{ value: 'abdomen_r', label: 'Right abdomen', region: 'Abdomen' },
	{ value: 'love_handle_l', label: 'Left love handle', region: 'Love handle' },
	{ value: 'love_handle_r', label: 'Right love handle', region: 'Love handle' },
	{ value: 'thigh_l', label: 'Left thigh', region: 'Thigh' },
	{ value: 'thigh_r', label: 'Right thigh', region: 'Thigh' },
	{ value: 'glute_l', label: 'Left glute', region: 'Glute' },
	{ value: 'glute_r', label: 'Right glute', region: 'Glute' }
];

export function siteLabel(s: InjectionSite | null | undefined): string {
	return INJECTION_SITES.find((x) => x.value === s)?.label ?? '—';
}
export function isInjectionSite(v: unknown): v is InjectionSite {
	return typeof v === 'string' && INJECTION_SITES.some((x) => x.value === v);
}

/** Given the sites used most recently (index 0 = most recent), suggest the least-recently-used site to
 *  rotate to — the safety nudge that reduces repeated-site lipohypertrophy/bruising. */
export function suggestNextSite(recentSitesMostRecentFirst: (InjectionSite | null)[]): InjectionSite {
	const used = recentSitesMostRecentFirst.filter(isInjectionSite);
	const unused = INJECTION_SITES.find((s) => !used.includes(s.value));
	if (unused) return unused.value;
	// All sites used — pick the one used longest ago (appears latest in the recency list, or not at all).
	let best = INJECTION_SITES[0].value;
	let bestRank = -1;
	for (const { value } of INJECTION_SITES) {
		const rank = used.indexOf(value); // smaller = more recent
		if (rank > bestRank) {
			bestRank = rank;
			best = value;
		}
	}
	return best;
}

/** Display a canonical mcg dose as mcg under 1000, otherwise mg. */
export function formatDose(mcg: number | null | undefined): string {
	if (mcg == null || !Number.isFinite(mcg)) return '—';
	if (mcg < 1000) return `${round(mcg, 0)} mcg`;
	return `${round(mcg / 1000, 3)} mg`;
}

export function mgToMcg(mg: number): number {
	return mg * 1000;
}
export function mcgToMg(mcg: number): number {
	return mcg / 1000;
}

function round(n: number, dp: number): number {
	const f = 10 ** dp;
	return Math.round(n * f) / f;
}
