// BMI from canonical units (kg + cm). WHO categories. Returns null when height is unknown so callers
// can hide the metric rather than show a bogus number.

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export function computeBmi(weightKg: number, heightCm: number | null | undefined): number | null {
	if (!heightCm || heightCm <= 0 || weightKg <= 0) return null;
	const m = heightCm / 100;
	return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
	if (bmi < 18.5) return 'underweight';
	if (bmi < 25) return 'normal';
	if (bmi < 30) return 'overweight';
	return 'obese';
}

export function bmiCategoryLabel(category: BmiCategory): string {
	return { underweight: 'Underweight', normal: 'Normal', overweight: 'Overweight', obese: 'Obese' }[category];
}
