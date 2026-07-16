-- One-time correction of preset product nutrition data that was seeded from unsourced estimates.
-- Values below are verified against Matvaretabellen.no, official brand product pages, and
-- Kassalapp/matoppskrift.no listings (see src/lib/server/presetData.ts). Matches by exact product
-- name across all users' rows, since presets are always seeded with these exact names. Only rows
-- for a currently-verified preset name are touched; "Pizzasnurrer" is left as-is (no verified
-- source was found for it, so it's dropped from future seeds rather than guessed again).
UPDATE products SET brand='Tine', serving_size='100 ml', calories=42, protein=3.6, carbs=4.7, fat=1 WHERE name='Lettmelk';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 ml', calories=64, protein=3.5, carbs=4.5, fat=3.5 WHERE name='Helmelk';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 ml', calories=34, protein=3.6, carbs=4.7, fat=0.1 WHERE name='Skummet melk';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=75, protein=12, carbs=4.3, fat=1 WHERE name='Yt Skyr Naturell';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=64, protein=8.5, carbs=3.3, fat=2 WHERE name='Yoghurt Naturell';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=79, protein=13, carbs=2.1, fat=2 WHERE name='Cottage Cheese Original';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=351, protein=27, carbs=0, fat=27 WHERE name='Jarlsberg';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=344, protein=27, carbs=0, fat=26 WHERE name='Norvegia';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=439, protein=11, carbs=30, fat=27 WHERE name='Brunost';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=717, protein=0.8, carbs=0.5, fat=81.1 WHERE name='Smør';
--> statement-breakpoint
UPDATE products SET serving_size='1 egg (60 g)', calories=89, protein=7.7, carbs=0.4, fat=6 WHERE name='Egg';
--> statement-breakpoint
UPDATE products SET brand='Bakers', serving_size='100 g', calories=219, protein=7.1, carbs=42.4, fat=1.5 WHERE name='Kneippbrød';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=239, protein=9, carbs=40, fat=3 WHERE name='Grovbrød';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=262, protein=8, carbs=50, fat=2 WHERE name='Loff';
--> statement-breakpoint
UPDATE products SET brand='Axa', serving_size='100 g tørr', calories=367, protein=13, carbs=58, fat=6.8 WHERE name='Havregryn';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=115, protein=2.5, carbs=25, fat=0.3 WHERE name='Ris, kokt';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=131, protein=5, carbs=25, fat=1.1 WHERE name='Pasta, kokt';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=80, protein=2, carbs=20, fat=0.1 WHERE name='Potet, kokt';
--> statement-breakpoint
UPDATE products SET brand='Gilde', serving_size='100 g', calories=194, protein=17, carbs=0, fat=14 WHERE name='Kjøttdeig 14%';
--> statement-breakpoint
UPDATE products SET brand='Prior', serving_size='100 g', calories=108, protein=23, carbs=0, fat=1.5 WHERE name='Kyllingfilet';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=208, protein=20, carbs=0, fat=13.4 WHERE name='Laksefilet';
--> statement-breakpoint
UPDATE products SET brand='Gilde', serving_size='100 g', calories=235, protein=11, carbs=6.5, fat=19 WHERE name='Servelat';
--> statement-breakpoint
UPDATE products SET brand='Nordfjord', serving_size='100 g', calories=345, protein=12, carbs=0, fat=33 WHERE name='Bacon';
--> statement-breakpoint
UPDATE products SET brand='Gilde', serving_size='100 g', calories=113, protein=19, carbs=2.1, fat=1.8 WHERE name='Kokt skinke';
--> statement-breakpoint
UPDATE products SET brand='Gilde', serving_size='100 g', calories=118, protein=19, carbs=0, fat=4.7 WHERE name='Karbonadedeig';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=100, protein=21, carbs=0, fat=1 WHERE name='Torskefilet';
--> statement-breakpoint
UPDATE products SET brand='Orkla', serving_size='100 g', calories=215, protein=9, carbs=26, fat=8.5 WHERE name='Grandiosa Original';
--> statement-breakpoint
UPDATE products SET brand='Findus', serving_size='100 g (ca. 3 stk)', calories=195, protein=13, carbs=18, fat=7.7 WHERE name='Fiskepinner';
--> statement-breakpoint
UPDATE products SET brand='Fjordland', serving_size='100 g', calories=118, protein=5.2, carbs=10, fat=6 WHERE name='Kjøttkaker i brun saus';
--> statement-breakpoint
UPDATE products SET brand='Toro', serving_size='100 ml', calories=22, protein=0.9, carbs=3.7, fat=0.3 WHERE name='Fiskesuppe, tilberedt';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=89, protein=1.1, carbs=23, fat=0.3 WHERE name='Banan';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=52, protein=0.3, carbs=14, fat=0.2 WHERE name='Eple';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=191, protein=1, carbs=0, fat=19 WHERE name='Avokado';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=35, protein=0.9, carbs=7.4, fat=0.2 WHERE name='Gulrot';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=34, protein=2.8, carbs=7, fat=0.4 WHERE name='Brokkoli';
--> statement-breakpoint
UPDATE products SET brand='Freia', serving_size='1 plate (47 g)', calories=252, protein=3.8, carbs=27.3, fat=14.1 WHERE name='Kvikk Lunsj';
--> statement-breakpoint
UPDATE products SET brand='Freia', serving_size='100 g', calories=549, protein=8.2, carbs=53, fat=34 WHERE name='Melkesjokolade';
--> statement-breakpoint
UPDATE products SET brand='Freia', serving_size='100 g', calories=540, protein=7, carbs=56, fat=32 WHERE name='Nugatti';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=598, protein=25, carbs=12, fat=50 WHERE name='Peanøttsmør';
--> statement-breakpoint
UPDATE products SET brand='Kims', serving_size='100 g', calories=542, protein=4.6, carbs=55, fat=33 WHERE name='Potetgull Original';
--> statement-breakpoint
UPDATE products SET brand='Sport', serving_size='100 g', calories=319, protein=10, carbs=57.3, fat=1.9 WHERE name='Knekkebrød';
--> statement-breakpoint
UPDATE products SET brand='Axa', serving_size='100 g', calories=350, protein=9.8, carbs=63, fat=5.2 WHERE name='Müsli';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=317, protein=0, carbs=78, fat=0 WHERE name='Honning';
--> statement-breakpoint
UPDATE products SET serving_size='100 ml', calories=892, protein=0, carbs=0, fat=99 WHERE name='Olivenolje';
--> statement-breakpoint
UPDATE products SET serving_size='100 g', calories=601, protein=21, carbs=6, fat=52 WHERE name='Mandler';
--> statement-breakpoint
UPDATE products SET brand='Q', serving_size='100 g', calories=70, protein=11, carbs=3.6, fat=1.5 WHERE name='Protein Yoghurt';
--> statement-breakpoint
UPDATE products SET brand='Tine', serving_size='100 g', calories=74, protein=10, carbs=4.7, fat=1.5 WHERE name='Yt Protein Pudding';
