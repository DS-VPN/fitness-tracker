/** Groups an ordered list of plan/session exercises into render blocks: standalone exercises stay
 *  singletons, while exercises sharing a non-null superset group collapse into one block (in their
 *  first-appearance order). Blocks preserve the original ordering by first appearance, so a superset
 *  renders where its first member sits. */
export type Block<T> = { superset: boolean; group: number | null; items: T[] };

export function groupIntoBlocks<T>(items: T[], getGroup: (item: T) => number | null): Block<T>[] {
	const blocks: Block<T>[] = [];
	const byGroup = new Map<number, Block<T>>();
	for (const item of items) {
		const group = getGroup(item);
		if (group == null) {
			blocks.push({ superset: false, group: null, items: [item] });
			continue;
		}
		let block = byGroup.get(group);
		if (!block) {
			block = { superset: true, group, items: [] };
			byGroup.set(group, block);
			blocks.push(block);
		}
		block.items.push(item);
	}
	return blocks;
}

/** A superset needs at least two exercises to be a superset; a lone tagged exercise renders normally. */
export function isSuperset<T>(block: Block<T>): boolean {
	return block.superset && block.items.length > 1;
}

/** 1 → "A", 2 → "B", … for display. */
export function supersetLabel(group: number): string {
	return String.fromCharCode(64 + group);
}

/** Options for the plan editor's superset picker: none + A–F. */
export const SUPERSET_OPTIONS: { value: string; label: string }[] = [
	{ value: '', label: 'None' },
	...Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: `Superset ${supersetLabel(i + 1)}` }))
];
