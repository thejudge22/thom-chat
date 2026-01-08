#!/usr/bin/env tsx
/**
 * Test script to verify encryption/decryption functionality
 *
 * This script tests the encryption utilities without modifying any data
 */

import { encryptApiKey, decryptApiKey, isEncrypted } from '../src/lib/encryption.js';

function testEncryption() {
	console.log('==================================================');
	console.log('  Encryption/Decryption Test');
	console.log('==================================================\n');

	// Test 1: Basic encryption/decryption
	console.log('Test 1: Basic encryption/decryption');
	const testKey1 = 'sk-test123456789abcdefghijklmnopqrstuvwxyz';
	console.log(`   Original:  ${testKey1}`);

	const encrypted = encryptApiKey(testKey1);
	console.log(`   Encrypted: ${encrypted.substring(0, 50)}...`);

	const decrypted = decryptApiKey(encrypted);
	console.log(`   Decrypted: ${decrypted}`);

	if (decrypted === testKey1) {
		console.log('   ✅ PASS: Encryption/decryption works correctly\n');
	} else {
		console.log('   ❌ FAIL: Decrypted key does not match original\n');
		process.exit(1);
	}

	// Test 2: Different keys produce different ciphertexts
	console.log('Test 2: Unique ciphertexts (random IV/salt)');
	const testKey2a = 'sk-test-key-a';
	const testKey2b = 'sk-test-key-b';

	const encrypted2a = encryptApiKey(testKey2a);
	const encrypted2b = encryptApiKey(testKey2b);

	console.log(`   Key A:      ${testKey2a}`);
	console.log(`   Encrypted A: ${encrypted2a.substring(0, 50)}...`);
	console.log(`   Key B:      ${testKey2b}`);
	console.log(`   Encrypted B: ${encrypted2b.substring(0, 50)}...`);

	if (encrypted2a !== encrypted2b) {
		console.log('   ✅ PASS: Different keys produce different ciphertexts\n');
	} else {
		console.log('   ❌ FAIL: Same ciphertext for different keys (IV/salt not working)\n');
		process.exit(1);
	}

	// Test 3: isEncrypted detection
	console.log('Test 3: Encryption detection');

	const plainKey = 'sk-plain-key-12345';
	const encryptedKey = encryptApiKey('sk-test-key');

	console.log(`   Plain key detected as encrypted: ${isEncrypted(plainKey)}`);
	console.log(`   Encrypted key detected as encrypted: ${isEncrypted(encryptedKey)}`);

	if (!isEncrypted(plainKey) && isEncrypted(encryptedKey)) {
		console.log('   ✅ PASS: Encryption detection works correctly\n');
	} else {
		console.log('   ❌ FAIL: Encryption detection not working\n');
		process.exit(1);
	}

	// Test 4: Same key encrypted twice produces different ciphertexts
	console.log('Test 4: Randomness (same key, different ciphertexts)');
	const testKey4 = 'sk-same-key';
	const encrypted4a = encryptApiKey(testKey4);
	const encrypted4b = encryptApiKey(testKey4);

	console.log(`   Key:         ${testKey4}`);
	console.log(`   Encrypted A: ${encrypted4a.substring(0, 50)}...`);
	console.log(`   Encrypted B: ${encrypted4b.substring(0, 50)}...`);

	if (encrypted4a !== encrypted4b) {
		console.log('   ✅ PASS: Same key produces different ciphertexts (good randomness)\n');
	} else {
		console.log('   ⚠️  WARNING: Same key produces same ciphertext (IV/salt may not be random)\n');
	}

	// Test 5: Round-trip for various key formats
	console.log('Test 5: Round-trip for various API key formats');
	const testKeys = [
		'sk-ant123456789',
		'nc_' + 'a'.repeat(32),
		'sk-proj-abc123def456ghi789jkl012mno345pq',
		'hf_abcdefghijklmnopqrstuvwxyz123456',
	];

	let allPassed = true;
	for (const key of testKeys) {
		const enc = encryptApiKey(key);
		const dec = decryptApiKey(enc);
		const passed = dec === key;
		console.log(`   ${key.substring(0, 30)}... ${passed ? '✅' : '❌'}`);
		if (!passed) allPassed = false;
	}

	if (allPassed) {
		console.log('   ✅ PASS: All key formats work correctly\n');
	} else {
		console.log('   ❌ FAIL: Some key formats failed\n');
		process.exit(1);
	}

	// Test 6: Error handling
	console.log('Test 6: Error handling');

	try {
		decryptApiKey('invalid-encrypted-key');
		console.log('   ❌ FAIL: Should have thrown error for invalid encrypted data\n');
		process.exit(1);
	} catch (error) {
		console.log('   ✅ PASS: Correctly throws error for invalid encrypted data');
		console.log(`      Error: ${(error as Error).message}\n`);
	}

	// Summary
	console.log('==================================================');
	console.log('  ✅ All tests passed!');
	console.log('==================================================\n');
	console.log('Encryption is working correctly. You can now:');
	console.log('1. Run the migration script to encrypt existing API keys');
	console.log('2. Start the application - new keys will be encrypted automatically\n');
}

// Run tests
try {
	testEncryption();
	process.exit(0);
} catch (error) {
	console.error('\n❌ Test failed with error:', error);
	process.exit(1);
}
