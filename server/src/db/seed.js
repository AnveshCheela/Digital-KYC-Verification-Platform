const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function seed() {
  const client = await pool.connect();

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@verifyflow.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    // Check if admin already exists
    const { rows } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (rows.length > 0) {
      console.log(`Admin user already exists: ${adminEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      await client.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'admin')`,
        [adminEmail, passwordHash, adminName]
      );

      console.log(`✔ Admin user created: ${adminEmail}`);
    }

    console.log('Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
