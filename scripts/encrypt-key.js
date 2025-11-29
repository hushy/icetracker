#!/usr/bin/env node
/**
 * Script to encrypt your Groq API key with a password
 * Usage: node scripts/encrypt-key.js
 */

import CryptoJS from 'crypto-js';
import * as readline from 'readline';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log('🔐 Groq API Key Encryption Tool\n');
  
  // Get API key from .env or prompt
  let apiKey = process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    console.log('No VITE_GROQ_API_KEY found in environment.');
    apiKey = await question('Enter your Groq API key: ');
    apiKey = apiKey.trim();
  } else {
    console.log('✓ Found API key in environment\n');
  }
  
  if (!apiKey || !apiKey.startsWith('gsk_')) {
    console.error('❌ Invalid API key (should start with "gsk_")');
    process.exit(1);
  }
  
  // Get password
  const password = await question('Enter password (or press Enter for default): ');
  const finalPassword = password.trim() || 'skate puck shoot goal';
  
  console.log(`\n🔒 Encrypting with password: "${finalPassword}"\n`);
  
  // Encrypt
  const encrypted = CryptoJS.AES.encrypt(apiKey, finalPassword).toString();
  
  console.log('✅ Encrypted key:');
  console.log('─'.repeat(60));
  console.log(encrypted);
  console.log('─'.repeat(60));
  
  // Update encryption.js file
  const encryptionFilePath = path.join(__dirname, '..', 'src', 'utils', 'encryption.js');
  let content = await fs.readFile(encryptionFilePath, 'utf-8');
  
  content = content.replace(
    /export const ENCRYPTED_API_KEY = ['"].*['"];/,
    `export const ENCRYPTED_API_KEY = '${encrypted}';`
  );
  
  await fs.writeFile(encryptionFilePath, content, 'utf-8');
  
  console.log('\n✅ Updated src/utils/encryption.js with encrypted key!');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   1. The encrypted key is now in your source code');
  console.log('   2. Remove or comment out VITE_GROQ_API_KEY from .env');
  console.log('   3. Users will be prompted for password on first use');
  console.log(`   4. Password: "${finalPassword}"\n`);
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

