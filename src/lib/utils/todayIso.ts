/** Today's date as 'YYYY-MM-DD' in the server's local timezone — the same convention
 *  workout_sessions.date and meal_logs.date use. */
export function todayIso(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
