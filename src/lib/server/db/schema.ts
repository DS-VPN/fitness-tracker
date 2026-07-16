import { integer, real, sqliteTable, text, primaryKey, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamp = (name: string) =>
	integer(name, { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`);

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at')
}, (t) => [unique('categories_name_unique').on(t.name)]);

export const meals = sqliteTable('meals', {
	id: integer('id').primaryKey({ autoIncrement: true }),
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
}, (t) => [index('meals_name_idx').on(t.name)]);

export const mealCategories = sqliteTable('meal_categories', {
	mealId: integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
	categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' })
}, (t) => [
	primaryKey({ columns: [t.mealId, t.categoryId] }),
	index('meal_categories_category_idx').on(t.categoryId)
]);

export const shoppingListItems = sqliteTable('shopping_list_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	mealId: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	brand: text('brand'),
	quantity: integer('quantity').notNull().default(1),
	checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
	createdAt: timestamp('created_at')
}, (t) => [index('shopping_list_meal_idx').on(t.mealId)]);

export const exercises = sqliteTable('exercises', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	muscleGroup: text('muscle_group'),
	createdAt: timestamp('created_at')
}, (t) => [unique('exercises_name_unique').on(t.name)]);

export const workoutSessions = sqliteTable('workout_sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at')
}, (t) => [index('workout_sessions_date_idx').on(t.date)]);

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
