// Starter data seeded into every account (see presets.ts) so new users don't start with empty
// product/exercise lists. Everything here is a normal, editable row once seeded — nothing about
// these presets is special or protected.

export type PresetProduct = {
	name: string;
	brand?: string;
	servingSize?: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

export type PresetExercise = {
	name: string;
	muscleGroup?: string;
};

// Common Meny.no staples. Macros verified against Matvaretabellen.no (the Norwegian Food Safety
// Authority's official food composition database), official brand product pages (tine.no,
// q-meieriene.no, axa.no, grandiosa.no), and Kassalapp/matoppskrift.no product listings, July 2026.
// Two items from the original list (a Findus "Pizzasnurrer" and a generic "Fiskesuppe") had no
// verifiable official source, so they were dropped/replaced rather than left as guesses.
export const presetProducts: PresetProduct[] = [
	{ name: 'Lettmelk', brand: 'Tine', servingSize: '100 ml', calories: 42, protein: 3.6, carbs: 4.7, fat: 1 },
	{ name: 'Helmelk', brand: 'Tine', servingSize: '100 ml', calories: 64, protein: 3.5, carbs: 4.5, fat: 3.5 },
	{ name: 'Skummet melk', brand: 'Tine', servingSize: '100 ml', calories: 34, protein: 3.6, carbs: 4.7, fat: 0.1 },
	{ name: 'Yt Skyr Naturell', brand: 'Tine', servingSize: '100 g', calories: 75, protein: 12, carbs: 4.3, fat: 1 },
	{ name: 'Yoghurt Naturell', brand: 'Tine', servingSize: '100 g', calories: 64, protein: 8.5, carbs: 3.3, fat: 2 },
	{ name: 'Cottage Cheese Original', brand: 'Tine', servingSize: '100 g', calories: 79, protein: 13, carbs: 2.1, fat: 2 },
	{ name: 'Jarlsberg', brand: 'Tine', servingSize: '100 g', calories: 351, protein: 27, carbs: 0, fat: 27 },
	{ name: 'Norvegia', brand: 'Tine', servingSize: '100 g', calories: 344, protein: 27, carbs: 0, fat: 26 },
	{ name: 'Brunost', brand: 'Tine', servingSize: '100 g', calories: 439, protein: 11, carbs: 30, fat: 27 },
	{ name: 'Smør', brand: 'Tine', servingSize: '100 g', calories: 717, protein: 0.8, carbs: 0.5, fat: 81.1 },
	{ name: 'Egg', servingSize: '1 egg (60 g)', calories: 89, protein: 7.7, carbs: 0.4, fat: 6 },
	{ name: 'Kneippbrød', brand: 'Bakers', servingSize: '100 g', calories: 219, protein: 7.1, carbs: 42.4, fat: 1.5 },
	{ name: 'Grovbrød', servingSize: '100 g', calories: 239, protein: 9, carbs: 40, fat: 3 },
	{ name: 'Loff', servingSize: '100 g', calories: 262, protein: 8, carbs: 50, fat: 2 },
	{ name: 'Havregryn', brand: 'Axa', servingSize: '100 g tørr', calories: 367, protein: 13, carbs: 58, fat: 6.8 },
	{ name: 'Ris, kokt', servingSize: '100 g', calories: 115, protein: 2.5, carbs: 25, fat: 0.3 },
	{ name: 'Pasta, kokt', servingSize: '100 g', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
	{ name: 'Potet, kokt', servingSize: '100 g', calories: 80, protein: 2, carbs: 20, fat: 0.1 },
	{ name: 'Kjøttdeig 14%', brand: 'Gilde', servingSize: '100 g', calories: 194, protein: 17, carbs: 0, fat: 14 },
	{ name: 'Kyllingfilet', brand: 'Prior', servingSize: '100 g', calories: 108, protein: 23, carbs: 0, fat: 1.5 },
	{ name: 'Laksefilet', servingSize: '100 g', calories: 208, protein: 20, carbs: 0, fat: 13.4 },
	{ name: 'Servelat', brand: 'Gilde', servingSize: '100 g', calories: 235, protein: 11, carbs: 6.5, fat: 19 },
	{ name: 'Bacon', brand: 'Nordfjord', servingSize: '100 g', calories: 345, protein: 12, carbs: 0, fat: 33 },
	{ name: 'Kokt skinke', brand: 'Gilde', servingSize: '100 g', calories: 113, protein: 19, carbs: 2.1, fat: 1.8 },
	{ name: 'Karbonadedeig', brand: 'Gilde', servingSize: '100 g', calories: 118, protein: 19, carbs: 0, fat: 4.7 },
	{ name: 'Torskefilet', servingSize: '100 g', calories: 100, protein: 21, carbs: 0, fat: 1 },
	{ name: 'Grandiosa Original', brand: 'Orkla', servingSize: '100 g', calories: 215, protein: 9, carbs: 26, fat: 8.5 },
	{ name: 'Fiskepinner', brand: 'Findus', servingSize: '100 g (ca. 3 stk)', calories: 195, protein: 13, carbs: 18, fat: 7.7 },
	{ name: 'Kjøttkaker i brun saus', brand: 'Fjordland', servingSize: '100 g', calories: 118, protein: 5.2, carbs: 10, fat: 6 },
	{ name: 'Kjøttsuppe med grønnsaker, tilberedt', brand: 'Toro', servingSize: '100 ml', calories: 22, protein: 0.9, carbs: 3.7, fat: 0.3 },
	{ name: 'Banan', servingSize: '100 g', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
	{ name: 'Eple', servingSize: '100 g', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
	{ name: 'Avokado', servingSize: '100 g', calories: 191, protein: 1, carbs: 0, fat: 19 },
	{ name: 'Gulrot', servingSize: '100 g', calories: 35, protein: 0.9, carbs: 7.4, fat: 0.2 },
	{ name: 'Brokkoli', servingSize: '100 g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
	{ name: 'Kvikk Lunsj', brand: 'Freia', servingSize: '1 plate (47 g)', calories: 252, protein: 3.8, carbs: 27.3, fat: 14.1 },
	{ name: 'Melkesjokolade', brand: 'Freia', servingSize: '100 g', calories: 549, protein: 8.2, carbs: 53, fat: 34 },
	{ name: 'Nugatti', brand: 'Freia', servingSize: '100 g', calories: 540, protein: 7, carbs: 56, fat: 32 },
	{ name: 'Peanøttsmør', servingSize: '100 g', calories: 598, protein: 25, carbs: 12, fat: 50 },
	{ name: 'Potetgull Original', brand: 'Kims', servingSize: '100 g', calories: 542, protein: 4.6, carbs: 55, fat: 33 },
	{ name: 'Knekkebrød', brand: 'Sport', servingSize: '100 g', calories: 319, protein: 10, carbs: 57.3, fat: 1.9 },
	{ name: 'Müsli', brand: 'Axa', servingSize: '100 g', calories: 350, protein: 9.8, carbs: 63, fat: 5.2 },
	{ name: 'Honning', servingSize: '100 g', calories: 317, protein: 0, carbs: 78, fat: 0 },
	{ name: 'Olivenolje', servingSize: '100 ml', calories: 892, protein: 0, carbs: 0, fat: 99 },
	{ name: 'Mandler', servingSize: '100 g', calories: 601, protein: 21, carbs: 6, fat: 52 },
	{ name: 'Protein Yoghurt', brand: 'Q', servingSize: '100 g', calories: 70, protein: 11, carbs: 3.6, fat: 1.5 },
	{ name: 'Yt Protein Pudding', brand: 'Tine', servingSize: '100 g', calories: 74, protein: 10, carbs: 4.7, fat: 1.5 }
];

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
