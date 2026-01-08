#!/usr/bin/env tsx
/**
 * Migration script to encrypt all existing API keys in the database
 *
 * This script will:
 * 1. Read all unencrypted API keys from user_keys and api_keys tables
 * 2. Encrypt them using the new encryption utilities
 * 3. Update the database with the encrypted values
 *
 * IMPORTANT:
 * - This script should be run AFTER setting the ENCRYPTION_KEY environment variable
 * - This should be run when the application is NOT being used
 * - BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT
 * - This operation is NOT reversible (unless you have a backup)
 */

import { db } from '../src/lib/db/index.js';
import { userKeys, apiKeys } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { encryptApiKey, isEncrypted } from '../src/lib/encryption.js';

async function migrateUserKeys() {
	console.log('\n🔐 Migrating user_keys table...');

	try {
		const keys = await db.select().from(userKeys).all();

		console.log(`   Found ${keys.length} user keys`);

		let encryptedCount = 0;
		let skippedCount = 0;

		for (const key of keys) {
			// Skip if already encrypted
			if (isEncrypted(key.key)) {
				skippedCount++;
				console.log(`   ⏭️  Skipping key ${key.id} (already encrypted)`);
				continue;
			}

			try {
				const encrypted = encryptApiKey(key.key);

				await db
					.update(userKeys)
					.set({ key: encrypted })
					.where(eq(userKeys.id, key.id))
					.run();

				encryptedCount++;
				console.log(`   ✅ Encrypted key ${key.id} for provider ${key.provider}`);
			} catch (error) {
				console.error(`   ❌ Failed to encrypt key ${key.id}:`, error);
			}
		}

		console.log(`   ✅ User keys migration complete: ${encryptedCount} encrypted, ${skippedCount} skipped`);
	} catch (error) {
		console.error('   ❌ Failed to migrate user keys:', error);
		throw error;
	}
}

async function migrateApiKeys() {
	console.log('\n🔐 Migrating api_keys table...');

	try {
		const keys = await db.select().from(apiKeys).all();

		console.log(`   Found ${keys.length} API keys`);

		let encryptedCount = 0;
		let skippedCount = 0;

		for (const key of keys) {
			// Skip if already encrypted
			if (isEncrypted(key.key)) {
				skippedCount++;
				console.log(`   ⏭️  Skipping key ${key.id} (already encrypted)`);
				continue;
			}

			try {
				const encrypted = encryptApiKey(key.key);

				await db
					.update(apiKeys)
					.set({ key: encrypted })
					.where(eq(apiKeys.id, key.id))
					.run();

				encryptedCount++;
				console.log(`   ✅ Encrypted key ${key.id} (${key.name})`);
			} catch (error) {
				console.error(`   ❌ Failed to encrypt key ${key.id}:`, error);
			}
		}

		console.log(`   ✅ API keys migration complete: ${encryptedCount} encrypted, ${skippedCount} skipped`);
	} catch (error) {
		console.error('   ❌ Failed to migrate API keys:', error);
		throw error;
	}
}

async function main() {
	console.log('==================================================');
	console.log('  API Key Encryption Migration Script');
	console.log('==================================================');

	// Check if ENCRYPTION_KEY is set
	if (!process.env.ENCRYPTION_KEY) {
		console.error('\n❌ ERROR: ENCRYPTION_KEY environment variable is not set!');
		console.error('Please set it before running this script:\n');
		console.error('  export ENCRYPTION_KEY="$(openssl rand -base64 32)"\n');
		process.exit(1);
	}

	if (process.env.ENCRYPTION_KEY.length < 32) {
		console.error('\n❌ ERROR: ENCRYPTION_KEY must be at least 32 characters long!');
		process.exit(1);
	}

	console.log('\n⚠️  WARNING: This will encrypt all API keys in your database.');
	console.log('⚠️  Make sure you have backed up your database before proceeding!');

	// Give user time to read and cancel
	console.log('\n⏳ Starting migration in 5 seconds... Press Ctrl+C to cancel.\n');
	await new Promise((resolve) => setTimeout(resolve, 5000));

	try {
		await migrateUserKeys();
		await migrateApiKeys();

		console.log('\n✨ Migration completed successfully!');
		console.log('\n📝 Summary:');
		console.log('   - All API keys have been encrypted in the database');
		console.log('   - The application will automatically decrypt keys when needed');
		console.log('   - Keep your ENCRYPTION_KEY safe and secure!');
		console.log('   - DO NOT lose or change the ENCRYPTION_KEY!\n');

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		console.error('\n⚠️  Some keys may have been encrypted while others were not.');
		console.error('⚠️  Please restore from backup and investigate the error before retrying.\n');
		process.exit(1);
	}
}

// Run the migration
main();
