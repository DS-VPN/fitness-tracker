// Reconstitution math — pure arithmetic, no medical judgement. Lyophilized peptide (vialMg of powder)
// is dissolved in bacWaterMl of bacteriostatic water; a dose in micrograms is then drawn on a U-100
// insulin syringe, whose scale is "units" where 100 units = 1 mL.
//
//   concentration (mcg/mL) = vialMg * 1000 / bacWaterMl
//   draw volume (mL)       = doseMcg / concentration
//   syringe units (U-100)  = volume * 100  =  doseMcg * bacWaterMl / (vialMg * 10)
//
// Worked example: 250 mcg dose, 5 mg vial, 2 mL water → (250 * 2) / (5 * 10) = 10 units = 0.10 mL.

export type ReconInput = { vialMg: number; bacWaterMl: number; doseMcg: number };

export function isReconInputValid(i: Partial<ReconInput>): i is ReconInput {
	return (
		Number.isFinite(i.vialMg) &&
		(i.vialMg as number) > 0 &&
		Number.isFinite(i.bacWaterMl) &&
		(i.bacWaterMl as number) > 0 &&
		Number.isFinite(i.doseMcg) &&
		(i.doseMcg as number) > 0
	);
}

/** Micrograms of peptide per mL of reconstituted solution. */
export function concentrationMcgPerMl(vialMg: number, bacWaterMl: number): number {
	return (vialMg * 1000) / bacWaterMl;
}

/** Insulin-syringe units (U-100) for a dose, rounded to 0.5 U — finer than a syringe can be read. */
export function syringeUnits({ vialMg, bacWaterMl, doseMcg }: ReconInput): number {
	const units = (doseMcg * bacWaterMl) / (vialMg * 10);
	return Math.round(units * 2) / 2;
}

/** Exact (unrounded) draw volume in mL for a dose. */
export function drawVolumeMl({ vialMg, bacWaterMl, doseMcg }: ReconInput): number {
	return doseMcg / concentrationMcgPerMl(vialMg, bacWaterMl);
}

/** Whole doses of doseMcg obtainable from one vial. */
export function dosesPerVial(vialMg: number, doseMcg: number): number {
	if (!(vialMg > 0) || !(doseMcg > 0)) return 0;
	return Math.floor((vialMg * 1000) / doseMcg);
}
