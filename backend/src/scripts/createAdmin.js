/**
 * One-time admin creation script.
 * Run: node src/scripts/createAdmin.js
 * 
 * This generates a bcrypt hash of your desired password and prints it.
 * Copy the hash to your .env file as ADMIN_PASSWORD_HASH.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter admin password to hash: ', async (password) => {
  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    rl.close();
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  console.log('\n✅ Password hashed successfully!\n');
  console.log('Add this to your backend .env file:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`ADMIN_USERNAME=admin`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('─────────────────────────────────────────────────────────────\n');

  rl.close();
});
