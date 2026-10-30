// Creates the first admin account using ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD from .env
// Run with: npm run seed

require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const { findAdminByEmail, createAdmin } = require('./models/admins');

async function main() {
  const name = process.env.ADMIN_NAME || 'Admin';
  const email = process.env.ADMIN_EMAIL;
  const password = (process.env.ADMIN_PASSWORD || '').trim(); // login ignores spaces around passwords too

  if (!email || !password) {
    console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.');
    process.exit(1);
  }
  if (['change-me-before-seeding', 'choose-a-strong-password'].includes(password)) {
    console.error('ADMIN_PASSWORD is still the example value. Choose your own password in .env first.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  // Running the seed twice should not create a second copy
  if (await findAdminByEmail(email)) {
    console.log(`Admin ${email} already exists. Nothing to do.`);
    return;
  }

  // Turn the password into a one-way hash. 10 = how much work bcrypt does (higher is slower and safer).
  const passwordHash = await bcrypt.hash(password, 10);
  await createAdmin({ name, email, passwordHash });

  console.log(`Admin created: ${email}`);
}

main().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
