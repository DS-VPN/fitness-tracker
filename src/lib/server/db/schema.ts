import { integer, real, sqliteTable, text, primaryKey, index, unique, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamp = (name: string) =>
	integer(name, { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`);

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at')
}, (t) => [uniqueIndex('users_username_lower_unique').on(sql`lower(${t.username})`)]);

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at'),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
}, (t) => [index('sessions_user_idx').on(t.userId)]);

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at')
}, (t) => [unique('categories_user_name_unique').on(t.userId, t.name)]);

export const meals = sqliteTable('meals', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	/** How many portions/servings this recipe is designed to make — per-portion macros = total / portions. */
	portions: real('portions').notNull().default(1),
	notes: text('notes'),
	brand: text('brand'),
	servingSize: text('serving_size'),
	calories: real('calories').notNull().default(0),
	protein: real('protein').notNull().default(0),
	carbs: real('carbs').notNull().default(0),
	fat: real('fat').notNull().default(0),
	fiber: real('fiber'),
	sugar: real('sugar'),
	sodium: real('sodium'),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
}, (t) => [index('meals_user_idx').on(t.userId), index('meals_name_idx').on(t.name)]);

export const mealCategories = sqliteTable('meal_categories', {
	mealId: integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' })
}, (t) => [
	primaryKey({ columns: [t.mealId, t.categoryId] }),
	index('meal_categories_category_idx').on(t.categoryId)
]);

export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	brand: text('brand'),
	/** EAN/UPC from barcode scanning — lets a repeat scan match this product locally without any API lookup. */
	barcode: text('barcode'),
	/** The macros below are per `amount` `unit`s of this product (e.g. amount=100, unit='g' — a nutrition-label serving). */
	amount: real('amount').notNull().default(100),
	unit: text('unit').notNull().default('g'),
	calories: real('calories').notNull().default(0),
	protein: real('protein').notNull().default(0),
	carbs: real('carbs').notNull().default(0),
	fat: real('fat').notNull().default(0),
	fiber: real('fiber'),
	sugar: real('sugar'),
	sodium: real('sodium'),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
}, (t) => [
	index('products_user_idx').on(t.userId),
	index('products_name_idx').on(t.name),
	index('products_barcode_idx').on(t.barcode),
	check('products_unit_valid', sql`${t.unit} in ('g', 'ml', 'pcs')`)
]);

/** An ingredient in a meal's recipe: exactly one of productId/subMealId is set (enforced below and in the repo layer). */
export const mealIngredients = sqliteTable('meal_ingredients', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	mealId: integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
	productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
	subMealId: integer('sub_meal_id').references(() => meals.id, { onDelete: 'cascade' }),
	quantity: real('quantity').notNull().default(1),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at')
}, (t) => [
	index('meal_ingredients_meal_idx').on(t.mealId),
	index('meal_ingredients_product_idx').on(t.productId),
	index('meal_ingredients_submeal_idx').on(t.subMealId),
	check(
		'meal_ingredients_exactly_one_ref',
		sql`(${t.productId} is not null and ${t.subMealId} is null) or (${t.productId} is null and ${t.subMealId} is not null)`
	)
]);

/** A line on the shopping list. Product-linked rows (productId set) are the ingredient-derived kind — their
 *  amount is computed live from shoppingListItemSources + the current recipe, never stored, so editing a
 *  meal's ingredient quantities is reflected automatically. name/brand/quantity are used only for manual,
 *  freeform items (productId null) which have no recipe to derive an amount from. */
export const shoppingListItems = sqliteTable('shopping_list_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
	name: text('name'),
	brand: text('brand'),
	quantity: integer('quantity').notNull().default(1),
	checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
	createdAt: timestamp('created_at')
}, (t) => [
	index('shopping_list_user_idx').on(t.userId),
	index('shopping_list_product_idx').on(t.productId),
	uniqueIndex('shopping_list_items_user_product_unique').on(t.userId, t.productId).where(sql`${t.productId} is not null`)
]);

/** One meal's (or a direct add's, when mealId is null) contribution to a product-linked shopping list item.
 *  No amount is stored here — it's computed live at read time from the meal's current ingredient quantity,
 *  so quantities update automatically when a recipe is edited. multiplier accumulates on repeat adds. */
export const shoppingListItemSources = sqliteTable('shopping_list_item_sources', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	itemId: integer('item_id').notNull().references(() => shoppingListItems.id, { onDelete: 'cascade' }),
	mealId: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
	/** Snapshot of the meal's name, shown only once mealId has gone null (source meal deleted). */
	mealName: text('meal_name'),
	multiplier: real('multiplier').notNull().default(1),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
}, (t) => [
	index('shopping_list_item_sources_item_idx').on(t.itemId),
	index('shopping_list_item_sources_meal_idx').on(t.mealId)
]);

/** Grants sharedWithUserId read/write access to ownerId's shopping list. */
export const shoppingListShares = sqliteTable('shopping_list_shares', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	sharedWithUserId: integer('shared_with_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at')
}, (t) => [
	unique('shopping_list_shares_pair_unique').on(t.ownerId, t.sharedWithUserId),
	index('shopping_list_shares_owner_idx').on(t.ownerId),
	index('shopping_list_shares_shared_with_idx').on(t.sharedWithUserId)
]);

/** Grants sharedWithUserId read access to some of ownerId's meals. Scope is implied by which
 *  target column is set: both null = the whole meal library; categoryId set = every meal in that
 *  category; mealId set = that single meal. A pair can hold many grants (e.g. two categories +
 *  one meal). Access is read-only for the recipient — using a shared meal (log it, add its
 *  ingredients to your own list) writes only to the recipient's own data, never the owner's. */
export const mealShares = sqliteTable('meal_shares', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	sharedWithUserId: integer('shared_with_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	mealId: integer('meal_id').references(() => meals.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at')
}, (t) => [
	index('meal_shares_owner_idx').on(t.ownerId),
	index('meal_shares_shared_with_idx').on(t.sharedWithUserId),
	index('meal_shares_meal_idx').on(t.mealId),
	index('meal_shares_category_idx').on(t.categoryId),
	check('meal_shares_scope_valid', sql`not (${t.mealId} is not null and ${t.categoryId} is not null)`)
]);

/** Shared, read-only catalog of Norwegian food products imported from Open Food Facts (see
 *  catalogData.ts / scripts/import-off-catalog.mjs). Global (no userId) — users search it and copy
 *  a row into their own products on demand (addCatalogProductToUser). Macros are per `amount` `unit`
 *  (always per 100 g/ml). offCode is the OFF barcode, used as the stable idempotent seed key. */
export const catalogProducts = sqliteTable('catalog_products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	offCode: text('off_code').notNull(),
	name: text('name').notNull(),
	brand: text('brand'),
	barcode: text('barcode'),
	amount: real('amount').notNull().default(100),
	unit: text('unit').notNull().default('g'),
	calories: real('calories').notNull().default(0),
	protein: real('protein').notNull().default(0),
	carbs: real('carbs').notNull().default(0),
	fat: real('fat').notNull().default(0),
	fiber: real('fiber'),
	sugar: real('sugar'),
	sodium: real('sodium'),
	createdAt: timestamp('created_at')
}, (t) => [
	uniqueIndex('catalog_products_off_code_unique').on(t.offCode),
	index('catalog_products_name_idx').on(t.name),
	check('catalog_products_unit_valid', sql`${t.unit} in ('g', 'ml', 'pcs')`)
]);

export const exercises = sqliteTable('exercises', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	brand: text('brand'),
	muscleGroup: text('muscle_group'),
	createdAt: timestamp('created_at')
}, (t) => [unique('exercises_user_name_brand_unique').on(t.userId, t.name, t.brand)]);

export const workoutPlans = sqliteTable('workout_plans', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	createdAt: timestamp('created_at')
}, (t) => [index('workout_plans_user_idx').on(t.userId)]);

export const planExercises = sqliteTable('plan_exercises', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	planId: integer('plan_id').notNull().references(() => workoutPlans.id, { onDelete: 'cascade' }),
	exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
	targetSets: integer('target_sets'),
	restSeconds: integer('rest_seconds'),
	notes: text('notes'),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at')
}, (t) => [
	index('plan_exercises_plan_idx').on(t.planId),
	index('plan_exercises_exercise_idx').on(t.exerciseId)
]);

export const workoutSessions = sqliteTable('workout_sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	planId: integer('plan_id').references(() => workoutPlans.id, { onDelete: 'set null' }),
	date: text('date').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at')
}, (t) => [index('workout_sessions_user_idx').on(t.userId), index('workout_sessions_date_idx').on(t.date)]);

export const workoutSets = sqliteTable('workout_sets', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sessionId: integer('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
	exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
	order: integer('order').notNull().default(0),
	reps: integer('reps').notNull(),
	weight: real('weight').notNull().default(0),
	rpe: real('rpe'),
	notes: text('notes'),
	createdAt: timestamp('created_at')
}, (t) => [
	index('workout_sets_session_idx').on(t.sessionId),
	index('workout_sets_exercise_idx').on(t.exerciseId)
]);

/** Daily macro targets. `label` is the hook for per-day-type targets later (e.g. 'training'/'rest');
 *  v1 only ever reads and writes the 'default' row. */
export const nutritionTargets = sqliteTable('nutrition_targets', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	label: text('label').notNull().default('default'),
	calories: real('calories').notNull(),
	protein: real('protein').notNull(),
	carbs: real('carbs').notNull(),
	fat: real('fat').notNull(),
	updatedAt: timestamp('updated_at')
}, (t) => [unique('nutrition_targets_user_label_unique').on(t.userId, t.label)]);

/** The food diary. Each entry snapshots name and CONSUMED macros (already multiplied by portions) at log
 *  time, so editing/deleting a recipe never rewrites past days and a day sums with one query. mealId/
 *  productId are provenance only (at most one set; may both become null after the source is deleted). */
export const mealLogs = sqliteTable('meal_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	date: text('date').notNull(),
	name: text('name').notNull(),
	brand: text('brand'),
	portions: real('portions').notNull().default(1),
	calories: real('calories').notNull(),
	protein: real('protein').notNull(),
	carbs: real('carbs').notNull(),
	fat: real('fat').notNull(),
	mealId: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
	productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at')
}, (t) => [index('meal_logs_user_date_idx').on(t.userId, t.date)]);

/** One active strength goal per exercise (upsert semantics — the UNIQUE is droppable later for goal history). */
export const exerciseGoals = sqliteTable('exercise_goals', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
	targetWeight: real('target_weight').notNull(),
	targetReps: integer('target_reps').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
}, (t) => [unique('exercise_goals_exercise_unique').on(t.exerciseId)]);

/** Server-side cache of Open Food Facts barcode lookups (global product data, deliberately not per-user).
 *  Misses are cached too, so repeat scans of an unknown code don't re-hit the API. */
export const barcodeCache = sqliteTable('barcode_cache', {
	barcode: text('barcode').primaryKey(),
	payload: text('payload').notNull(),
	fetchedAt: timestamp('fetched_at')
});
