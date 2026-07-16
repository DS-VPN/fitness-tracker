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
}, (t) => [index('products_user_idx').on(t.userId), index('products_name_idx').on(t.name)]);

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

export const shoppingListItems = sqliteTable('shopping_list_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	mealId: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	brand: text('brand'),
	quantity: integer('quantity').notNull().default(1),
	checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
	createdAt: timestamp('created_at')
}, (t) => [index('shopping_list_user_idx').on(t.userId), index('shopping_list_meal_idx').on(t.mealId)]);

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
