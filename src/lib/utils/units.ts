// Body metrics are stored canonically (weight in kg, lengths in cm); these convert to/from the user's
// display preference at the UI edge. Keep them dependency-free and pure so they can run on client or server.

export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';

const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

export function kgToDisplay(kg: number, unit: WeightUnit): number {
	return unit === 'lb' ? kg * LB_PER_KG : kg;
}

export function displayToKg(value: number, unit: WeightUnit): number {
	return unit === 'lb' ? value / LB_PER_KG : value;
}

export function cmToDisplay(cm: number, unit: LengthUnit): number {
	return unit === 'in' ? cm / CM_PER_IN : cm;
}

export function displayToCm(value: number, unit: LengthUnit): number {
	return unit === 'in' ? value * CM_PER_IN : value;
}

/** Rounds to one decimal for display — enough precision for body weight/measurements without noise. */
export function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
	return `${round1(kgToDisplay(kg, unit))} ${unit}`;
}

export function formatLength(cm: number, unit: LengthUnit): string {
	return `${round1(cmToDisplay(cm, unit))} ${unit}`;
}
