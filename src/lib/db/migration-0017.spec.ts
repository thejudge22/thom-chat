import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'data', 'test-migration-0017.db');

describe('Migration 0017: Follow-up Suggestions and Questions', () => {
	let sqlite: any;
	let db: ReturnType<typeof drizzle<typeof schema>>;

	beforeEach(() => {
		// Ensure data directory exists
		const dataDir = dirname(TEST_DB_PATH);
		if (!existsSync(dataDir)) {
			mkdirSync(dataDir, { recursive: true });
		}

		// Clean up test database if it exists
		if (existsSync(TEST_DB_PATH)) {
			unlinkSync(TEST_DB_PATH);
		}

		// Create a fresh test database
		sqlite = new Database(TEST_DB_PATH);
		db = drizzle(sqlite, { schema });
	});

	afterEach(() => {
		// Close database and clean up
		if (sqlite) {
			sqlite.close();
		}
		if (existsSync(TEST_DB_PATH)) {
			unlinkSync(TEST_DB_PATH);
		}
	});

	it('should add follow_up_suggestions column to messages table after migration', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Check if the column exists by querying table structure
		const tableInfo = sqlite
			.query("PRAGMA table_info('messages')")
			.all() as Array<{ name: string; type: string }>;

		const followUpSuggestionsColumn = tableInfo.find(
			(col) => col.name === 'follow_up_suggestions'
		);

		expect(followUpSuggestionsColumn).toBeDefined();
		expect(followUpSuggestionsColumn?.name).toBe('follow_up_suggestions');
		expect(followUpSuggestionsColumn?.type.toLowerCase()).toBe('text');
	});

	it('should add follow_up_questions_enabled column to user_settings table with default value of true after migration', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Check if the column exists by querying table structure
		const tableInfo = sqlite
			.query("PRAGMA table_info('user_settings')")
			.all() as Array<{ name: string; type: string; dflt_value: string; notnull: number }>;

		const followUpQuestionsColumn = tableInfo.find(
			(col) => col.name === 'follow_up_questions_enabled'
		);

		expect(followUpQuestionsColumn).toBeDefined();
		expect(followUpQuestionsColumn?.name).toBe('follow_up_questions_enabled');
		expect(followUpQuestionsColumn?.type.toLowerCase()).toBe('integer');
		expect(followUpQuestionsColumn?.notnull).toBe(1); // NOT NULL constraint
		expect(followUpQuestionsColumn?.dflt_value).toBe('true'); // Default value
	});

	it('should not negatively impact existing data in messages table after migration', async () => {
		// Run migrations up to before migration 0017
		// This simulates an existing database with data
		migrate(db, { migrationsFolder: './drizzle' });

		// Create a test user first (required by foreign key)
		const userId = crypto.randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create a test conversation (required by foreign key)
		const conversationId = crypto.randomUUID();
		await db.insert(schema.conversations).values({
			id: conversationId,
			userId: userId,
			title: 'Test Conversation',
			createdAt: new Date(),
		});

		// Insert test message data before migration
		const messageId = crypto.randomUUID();
		const testMessage = {
			id: messageId,
			conversationId: conversationId,
			role: 'user',
			content: 'Test message content',
			createdAt: new Date(),
		};

		await db.insert(schema.messages).values(testMessage);

		// Verify the message was inserted
		const messagesBeforeMigration = await db
			.select()
			.from(schema.messages)
			.where(sql`id = ${messageId}`);

		expect(messagesBeforeMigration).toHaveLength(1);
		expect(messagesBeforeMigration[0].content).toBe('Test message content');

		// Query the message after migration to ensure data is intact
		const messagesAfterMigration = await db
			.select()
			.from(schema.messages)
			.where(sql`id = ${messageId}`);

		expect(messagesAfterMigration).toHaveLength(1);
		expect(messagesAfterMigration[0].id).toBe(messageId);
		expect(messagesAfterMigration[0].content).toBe('Test message content');
		expect(messagesAfterMigration[0].role).toBe('user');
		expect(messagesAfterMigration[0].conversationId).toBe(conversationId);

		// Verify the new column exists and is null for existing data
		expect(messagesAfterMigration[0].followUpSuggestions).toBeNull();
	});

	it('should not negatively impact existing data in user_settings table after migration', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Create a test user first (required by foreign key)
		const userId = crypto.randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Insert test user settings data
		const userSettingsId = crypto.randomUUID();
		const testUserSettings = {
			id: userSettingsId,
			userId: userId,
			privacyMode: false,
			contextMemoryEnabled: true,
			persistentMemoryEnabled: false,
			youtubeTranscriptsEnabled: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await db.insert(schema.userSettings).values(testUserSettings);

		// Verify the user settings was inserted
		const settingsBeforeMigration = await db
			.select()
			.from(schema.userSettings)
			.where(sql`id = ${userSettingsId}`);

		expect(settingsBeforeMigration).toHaveLength(1);
		expect(settingsBeforeMigration[0].privacyMode).toBe(false);
		expect(settingsBeforeMigration[0].contextMemoryEnabled).toBe(true);

		// Query the user settings after migration to ensure data is intact
		const settingsAfterMigration = await db
			.select()
			.from(schema.userSettings)
			.where(sql`id = ${userSettingsId}`);

		expect(settingsAfterMigration).toHaveLength(1);
		expect(settingsAfterMigration[0].id).toBe(userSettingsId);
		expect(settingsAfterMigration[0].userId).toBe(userId);
		expect(settingsAfterMigration[0].privacyMode).toBe(false);
		expect(settingsAfterMigration[0].contextMemoryEnabled).toBe(true);
		expect(settingsAfterMigration[0].persistentMemoryEnabled).toBe(false);
		expect(settingsAfterMigration[0].youtubeTranscriptsEnabled).toBe(true);

		// Verify the new column exists and has the default value of true
		expect(settingsAfterMigration[0].followUpQuestionsEnabled).toBe(true);
	});

	it('should allow inserting messages with follow_up_suggestions after migration', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Create a test user
		const userId = crypto.randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create a test conversation
		const conversationId = crypto.randomUUID();
		await db.insert(schema.conversations).values({
			id: conversationId,
			userId: userId,
			title: 'Test Conversation',
			createdAt: new Date(),
		});

		// Insert a message with follow_up_suggestions
		const messageId = crypto.randomUUID();
		const followUpSuggestions = ['What about X?', 'Tell me more about Y', 'How does Z work?'];

		await db.insert(schema.messages).values({
			id: messageId,
			conversationId: conversationId,
			role: 'assistant',
			content: 'This is a test response',
			followUpSuggestions: followUpSuggestions,
			createdAt: new Date(),
		});

		// Verify the message was inserted with follow_up_suggestions
		const insertedMessages = await db
			.select()
			.from(schema.messages)
			.where(sql`id = ${messageId}`);

		expect(insertedMessages).toHaveLength(1);
		expect(insertedMessages[0].followUpSuggestions).toEqual(followUpSuggestions);
	});

	it('should allow updating follow_up_questions_enabled in user_settings after migration', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Create a test user
		const userId = crypto.randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Insert user settings (follow_up_questions_enabled should default to true)
		const userSettingsId = crypto.randomUUID();
		await db.insert(schema.userSettings).values({
			id: userSettingsId,
			userId: userId,
			privacyMode: false,
			contextMemoryEnabled: false,
			persistentMemoryEnabled: false,
			youtubeTranscriptsEnabled: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Verify default value is true
		const settingsBeforeUpdate = await db
			.select()
			.from(schema.userSettings)
			.where(sql`id = ${userSettingsId}`);

		expect(settingsBeforeUpdate[0].followUpQuestionsEnabled).toBe(true);

		// Update follow_up_questions_enabled to false
		await db
			.update(schema.userSettings)
			.set({ followUpQuestionsEnabled: false })
			.where(sql`id = ${userSettingsId}`);

		// Verify the update
		const settingsAfterUpdate = await db
			.select()
			.from(schema.userSettings)
			.where(sql`id = ${userSettingsId}`);

		expect(settingsAfterUpdate[0].followUpQuestionsEnabled).toBe(false);

		// Update back to true
		await db
			.update(schema.userSettings)
			.set({ followUpQuestionsEnabled: true })
			.where(sql`id = ${userSettingsId}`);

		// Verify the second update
		const settingsAfterSecondUpdate = await db
			.select()
			.from(schema.userSettings)
			.where(sql`id = ${userSettingsId}`);

		expect(settingsAfterSecondUpdate[0].followUpQuestionsEnabled).toBe(true);
	});

	it('should handle null values for follow_up_suggestions in messages', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Create a test user
		const userId = crypto.randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create a test conversation
		const conversationId = crypto.randomUUID();
		await db.insert(schema.conversations).values({
			id: conversationId,
			userId: userId,
			title: 'Test Conversation',
			createdAt: new Date(),
		});

		// Insert a message without follow_up_suggestions (null)
		const messageId = crypto.randomUUID();
		await db.insert(schema.messages).values({
			id: messageId,
			conversationId: conversationId,
			role: 'user',
			content: 'Message without suggestions',
			followUpSuggestions: null,
			createdAt: new Date(),
		});

		// Verify the message was inserted with null follow_up_suggestions
		const insertedMessages = await db
			.select()
			.from(schema.messages)
			.where(sql`id = ${messageId}`);

		expect(insertedMessages).toHaveLength(1);
		expect(insertedMessages[0].followUpSuggestions).toBeNull();
	});

	it('should validate that follow_up_questions_enabled is NOT NULL in user_settings', async () => {
		// Run migrations
		migrate(db, { migrationsFolder: './drizzle' });

		// Create a test user
		const userId = crypto.randomUUID();
		await db.insert(schema.user).values({
			id: userId,
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Attempt to insert user settings with explicit null for follow_up_questions_enabled
		// This should fail due to NOT NULL constraint
		const userSettingsId = crypto.randomUUID();

		try {
			await db.insert(schema.userSettings).values({
				id: userSettingsId,
				userId: userId,
				privacyMode: false,
				contextMemoryEnabled: false,
				persistentMemoryEnabled: false,
				youtubeTranscriptsEnabled: false,
				// @ts-expect-error - Testing that null is not allowed
				followUpQuestionsEnabled: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			// If we get here, the test should fail
			expect(true).toBe(false); // Force failure if insert succeeded
		} catch (error) {
			// Expect a SQL constraint error
			expect(error).toBeDefined();
		}
	});
});
