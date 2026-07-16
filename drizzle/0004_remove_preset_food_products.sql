-- Removes every product ever seeded by the old "starter Meny.no products" feature, across all
-- accounts, by request — products are now user-created only (see presets.ts / presetData.ts,
-- which no longer contain any product data at all). Matches by exact name, covering both the
-- current preset list and two names from earlier revisions of it that are no longer seeded
-- ("Pizzasnurrer", "Fiskesuppe, tilberedt") but may still exist on accounts seeded before this.
-- Note: this cascades to meal_ingredients, so any meal built using one of these as an ingredient
-- loses that ingredient row.
DELETE FROM products WHERE name IN (
	'Lettmelk', 'Helmelk', 'Skummet melk', 'Yt Skyr Naturell', 'Yoghurt Naturell',
	'Cottage Cheese Original', 'Jarlsberg', 'Norvegia', 'Brunost', 'Smør', 'Egg',
	'Kneippbrød', 'Grovbrød', 'Loff', 'Havregryn', 'Ris, kokt', 'Pasta, kokt', 'Potet, kokt',
	'Kjøttdeig 14%', 'Kyllingfilet', 'Laksefilet', 'Servelat', 'Bacon', 'Kokt skinke',
	'Karbonadedeig', 'Torskefilet', 'Grandiosa Original', 'Fiskepinner',
	'Kjøttkaker i brun saus', 'Kjøttsuppe med grønnsaker, tilberedt', 'Fiskesuppe, tilberedt',
	'Pizzasnurrer', 'Banan', 'Eple', 'Avokado', 'Gulrot', 'Brokkoli', 'Kvikk Lunsj',
	'Melkesjokolade', 'Nugatti', 'Peanøttsmør', 'Potetgull Original', 'Knekkebrød', 'Müsli',
	'Honning', 'Olivenolje', 'Mandler', 'Protein Yoghurt', 'Yt Protein Pudding'
);