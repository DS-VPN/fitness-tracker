import { db } from '$lib/server/db';
import { bodyWeights } from '$lib/server/db/schema';
import { and, asc, eq, gte } from 'drizzle-orm';

export type WeighIn = { date: string; weightKg: number };
export type TrendPoint = WeighIn & { trendKg: number };

/** Per-day smoothing constant for the trend line (Hacker's Diet-style exponential moving average
 *  with a ~10-day time constant). Applied per calendar day, so gaps between weigh-ins decay
 *  proportionally and sparse logging still yields a stable trend. */
const ALPHA_PER_DAY = 0.1;

function daysBetween(fromIso: string, toIso: string): number {
	// Noon anchors sidestep DST edges, same trick as shiftIsoDate.
	const at = (iso: string) => new Date(`${iso}T12:00:00`).getTime();
	return Math.max(1, Math.round((at(toIso) - at(fromIso)) / 86_400_000));
}

/** Upserts the weigh-in for a date — one per user per day; re-logging a day overwrites it. */
export async function logWeight(userId: number, date: string, weightKg: number) {
	if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg >= 500) {
		throw new Error('Enter your weight in kg');
	}
	const rounded = Math.round(weightKg * 100) / 100;
	const now = new Date();
	const [row] = await db
		.insert(bodyWeights)
		.values({ userId, date, weightKg: rounded, createdAt: now, updatedAt: now })
		.onConflictDoUpdate({
			target: [bodyWeights.userId, bodyWeights.date],
			set: { weightKg: rounded, updatedAt: now }
		})
		.returning();
	return row;
}

/** Weigh-ins from `fromDate` (inclusive) onward, oldest first. Omit `fromDate` for all of them. */
export async function listWeights(userId: number, fromDate?: string): Promise<WeighIn[]> {
	const conditions = [eq(bodyWeights.userId, userId)];
	if (fromDate) conditions.push(gte(bodyWeights.date, fromDate));
	return db
		.select({ date: bodyWeights.date, weightKg: bodyWeights.weightKg })
		.from(bodyWeights)
		.where(and(...conditions))
		.orderBy(asc(bodyWeights.date));
}

/** Attaches the smoothed trend to a date-ascending list of weigh-ins. */
export function withTrend(entries: WeighIn[]): TrendPoint[] {
	let trend: number | null = null;
	let prevDate: string | null = null;
	const points: TrendPoint[] = [];
	for (const entry of entries) {
		if (trend == null || prevDate == null) {
			trend = entry.weightKg;
		} else {
			const alpha = 1 - Math.pow(1 - ALPHA_PER_DAY, daysBetween(prevDate, entry.date));
			trend = trend + alpha * (entry.weightKg - trend);
		}
		prevDate = entry.date;
		points.push({ ...entry, trendKg: Math.round(trend * 100) / 100 });
	}
	return points;
}
