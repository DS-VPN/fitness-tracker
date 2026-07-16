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

// Common Meny.no staples. Macros are typical values for each product's usual retail form (not
// scraped from Meny.no directly) — adjust the seeded entry if a specific package differs.
export const presetProducts: PresetProduct[] = [
	{ name: 'Lettmelk', brand: 'Tine', servingSize: '100 ml', calories: 42, protein: 3.4, carbs: 4.7, fat: 1.2 },
	{ name: 'Helmelk', brand: 'Tine', servingSize: '100 ml', calories: 64, protein: 3.4, carbs: 4.5, fat: 3.5 },
	{ name: 'Skummet melk', brand: 'Tine', servingSize: '100 ml', calories: 35, protein: 3.5, carbs: 5.0, fat: 0.1 },
	{ name: 'Yt Skyr Naturell', brand: 'Tine', servingSize: '100 g', calories: 63, protein: 11, carbs: 4, fat: 0.2 },
	{ name: 'Yoghurt Naturell', brand: 'Tine', servingSize: '100 g', calories: 66, protein: 3.8, carbs: 4.7, fat: 3.6 },
	{ name: 'Cottage Cheese Original', brand: 'Tine', servingSize: '100 g', calories: 98, protein: 12, carbs: 3.4, fat: 4.3 },
	{ name: 'Jarlsberg', brand: 'Tine', servingSize: '100 g', calories: 356, protein: 27, carbs: 0, fat: 27 },
	{ name: 'Norvegia', brand: 'Tine', servingSize: '100 g', calories: 350, protein: 25, carbs: 0, fat: 27 },
	{ name: 'Brunost', brand: 'Tine', servingSize: '100 g', calories: 375, protein: 9.7, carbs: 32, fat: 24 },
	{ name: 'Smør', brand: 'Tine', servingSize: '100 g', calories: 713, protein: 0.5, carbs: 0.5, fat: 79 },
	{ name: 'Egg', servingSize: '1 egg (60 g)', calories: 78, protein: 6.5, carbs: 0.5, fat: 5.5 },
	{ name: 'Kneippbrød', brand: 'Bakers', servingSize: '100 g', calories: 230, protein: 8, carbs: 42, fat: 2.5 },
	{ name: 'Grovbrød', servingSize: '100 g', calories: 220, protein: 9, carbs: 38, fat: 3 },
	{ name: 'Loff', servingSize: '100 g', calories: 265, protein: 8, carbs: 50, fat: 2 },
	{ name: 'Havregryn', brand: 'Axa', servingSize: '100 g tørr', calories: 375, protein: 13, carbs: 60, fat: 7 },
	{ name: 'Ris, kokt', servingSize: '100 g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
	{ name: 'Pasta, kokt', servingSize: '100 g', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
	{ name: 'Potet, kokt', servingSize: '100 g', calories: 87, protein: 2, carbs: 20, fat: 0.1 },
	{ name: 'Kjøttdeig 14%', brand: 'Gilde', servingSize: '100 g', calories: 220, protein: 18, carbs: 0, fat: 16 },
	{ name: 'Kyllingfilet', brand: 'Prior', servingSize: '100 g', calories: 110, protein: 23, carbs: 0, fat: 1.5 },
	{ name: 'Laksefilet', servingSize: '100 g', calories: 208, protein: 20, carbs: 0, fat: 13 },
	{ name: 'Servelat', brand: 'Gilde', servingSize: '100 g', calories: 220, protein: 12, carbs: 5, fat: 17 },
	{ name: 'Bacon', brand: 'Nordfjord', servingSize: '100 g', calories: 350, protein: 13, carbs: 0.5, fat: 33 },
	{ name: 'Kokt skinke', brand: 'Gilde', servingSize: '100 g', calories: 105, protein: 18, carbs: 1, fat: 3 },
	{ name: 'Karbonadedeig', brand: 'Gilde', servingSize: '100 g', calories: 200, protein: 17, carbs: 1, fat: 14 },
	{ name: 'Torskefilet', servingSize: '100 g', calories: 82, protein: 18, carbs: 0, fat: 0.6 },
	{ name: 'Grandiosa Original', brand: 'Orkla', servingSize: '100 g', calories: 245, protein: 9, carbs: 27, fat: 11 },
	{ name: 'Fiskepinner', brand: 'Findus', servingSize: '100 g (ca. 3 stk)', calories: 200, protein: 12, carbs: 18, fat: 9 },
	{ name: 'Kjøttkaker i brun saus', brand: 'Fjordland', servingSize: '100 g', calories: 150, protein: 9, carbs: 6, fat: 10 },
	{ name: 'Pizzasnurrer', brand: 'Findus', servingSize: '100 g', calories: 260, protein: 8, carbs: 30, fat: 11 },
	{ name: 'Banan', servingSize: '100 g', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
	{ name: 'Eple', servingSize: '100 g', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
	{ name: 'Avokado', servingSize: '100 g', calories: 160, protein: 2, carbs: 9, fat: 15 },
	{ name: 'Gulrot', servingSize: '100 g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
	{ name: 'Brokkoli', servingSize: '100 g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
	{ name: 'Kvikk Lunsj', brand: 'Freia', servingSize: '1 plate (47 g)', calories: 246, protein: 3.4, carbs: 27, fat: 13 },
	{ name: 'Melkesjokolade', brand: 'Freia', servingSize: '100 g', calories: 545, protein: 7, carbs: 57, fat: 31 },
	{ name: 'Nugatti', brand: 'Freia', servingSize: '100 g', calories: 540, protein: 7, carbs: 56, fat: 32 },
	{ name: 'Peanøttsmør', servingSize: '100 g', calories: 590, protein: 25, carbs: 15, fat: 50 },
	{ name: 'Potetgull Original', brand: 'Kims', servingSize: '100 g', calories: 535, protein: 6, carbs: 50, fat: 34 },
	{ name: 'Fiskesuppe, tilberedt', brand: 'Toro', servingSize: '100 ml', calories: 60, protein: 2, carbs: 6, fat: 3 },
	{ name: 'Knekkebrød', brand: 'Sport', servingSize: '100 g', calories: 355, protein: 10, carbs: 65, fat: 3 },
	{ name: 'Müsli', brand: 'Axa', servingSize: '100 g', calories: 380, protein: 9, carbs: 63, fat: 9 },
	{ name: 'Honning', servingSize: '100 g', calories: 304, protein: 0.3, carbs: 82, fat: 0 },
	{ name: 'Olivenolje', servingSize: '100 ml', calories: 824, protein: 0, carbs: 0, fat: 91.6 },
	{ name: 'Mandler', servingSize: '100 g', calories: 579, protein: 21, carbs: 22, fat: 50 },
	{ name: 'Protein Yoghurt', brand: 'Q', servingSize: '100 g', calories: 75, protein: 10, carbs: 6, fat: 1 },
	{ name: 'Yt Protein Pudding', brand: 'Tine', servingSize: '100 g', calories: 90, protein: 10, carbs: 8, fat: 2 }
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
