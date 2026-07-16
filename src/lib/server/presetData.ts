// Starter data seeded into every account (see presets.ts) so new users don't start with an empty
// exercise list. Everything here is a normal, editable row once seeded — nothing about these
// presets is special or protected. There's no equivalent product preset list anymore — food
// products are user-created only (see /shopping-list/products/new), by request.

export type PresetExercise = {
	name: string;
	muscleGroup?: string;
};

// The core barbell lifts plus the accessory movements most referenced across strength-training
// communities (r/Fitness, StrongLifts, Starting Strength, GZCLP, standard bodybuilding splits).
export const presetExercises: PresetExercise[] = [
	{ name: 'Barbell Back Squat', muscleGroup: 'Legs' },
	{ name: 'Barbell Front Squat', muscleGroup: 'Legs' },
	{ name: 'Conventional Deadlift', muscleGroup: 'Back' },
	{ name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
	{ name: 'Sumo Deadlift', muscleGroup: 'Legs' },
	{ name: 'Trap Bar Deadlift', muscleGroup: 'Legs' },
	{ name: 'Barbell Bench Press', muscleGroup: 'Chest' },
	{ name: 'Incline Barbell Bench Press', muscleGroup: 'Chest' },
	{ name: 'Close-Grip Bench Press', muscleGroup: 'Triceps' },
	{ name: 'Overhead Press', muscleGroup: 'Shoulders' },
	{ name: 'Push Press', muscleGroup: 'Shoulders' },
	{ name: 'Seated Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
	{ name: 'Arnold Press', muscleGroup: 'Shoulders' },
	{ name: 'Barbell Row', muscleGroup: 'Back' },
	{ name: 'Pendlay Row', muscleGroup: 'Back' },
	{ name: 'T-Bar Row', muscleGroup: 'Back' },
	{ name: 'Seated Cable Row', muscleGroup: 'Back' },
	{ name: 'Lat Pulldown', muscleGroup: 'Back' },
	{ name: 'Pull-Up', muscleGroup: 'Back' },
	{ name: 'Chin-Up', muscleGroup: 'Back' },
	{ name: 'Barbell Shrug', muscleGroup: 'Traps' },
	{ name: 'Hip Thrust', muscleGroup: 'Glutes' },
	{ name: 'Leg Press', muscleGroup: 'Legs' },
	{ name: 'Bulgarian Split Squat', muscleGroup: 'Legs' },
	{ name: 'Walking Lunge', muscleGroup: 'Legs' },
	{ name: 'Leg Extension', muscleGroup: 'Quads' },
	{ name: 'Lying Leg Curl', muscleGroup: 'Hamstrings' },
	{ name: 'Standing Calf Raise', muscleGroup: 'Calves' },
	{ name: 'Seated Calf Raise', muscleGroup: 'Calves' },
	{ name: 'Good Morning', muscleGroup: 'Hamstrings' },
	{ name: 'Face Pull', muscleGroup: 'Shoulders' },
	{ name: 'Lateral Raise', muscleGroup: 'Shoulders' },
	{ name: 'Front Raise', muscleGroup: 'Shoulders' },
	{ name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
	{ name: 'Barbell Curl', muscleGroup: 'Biceps' },
	{ name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
	{ name: 'Hammer Curl', muscleGroup: 'Biceps' },
	{ name: 'Preacher Curl', muscleGroup: 'Biceps' },
	{ name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
	{ name: 'Skull Crusher', muscleGroup: 'Triceps' },
	{ name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
	{ name: 'Dip', muscleGroup: 'Chest' },
	{ name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
	{ name: 'Dumbbell Chest Fly', muscleGroup: 'Chest' },
	{ name: 'Cable Crossover', muscleGroup: 'Chest' },
	{ name: 'Plank', muscleGroup: 'Core' },
	{ name: 'Hanging Leg Raise', muscleGroup: 'Core' },
	{ name: "Farmer's Carry", muscleGroup: 'Full Body' }
];
