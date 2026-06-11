const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions wrapping sqlite3 in Promises
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function initDb() {
  // Enable foreign keys
  await dbRun('PRAGMA foreign_keys = ON;');

  // Create Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'customer', 'servant'
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Servant Profiles Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS servant_profiles (
      user_id INTEGER PRIMARY KEY,
      nid TEXT UNIQUE NOT NULL,
      nid_front TEXT,
      nid_back TEXT,
      type TEXT NOT NULL, -- 'part_time', 'full_time'
      skills TEXT NOT NULL, -- comma-separated tasks: 'cooking,cleaning,washing'
      rate INTEGER NOT NULL, -- base rate per month or task-based preferred rate
      locations TEXT NOT NULL, -- comma-separated blocks: 'Block A,Block B,Block I'
      time_slots TEXT NOT NULL, -- comma-separated, e.g. 'Morning (8:00 AM - 12:00 PM),Afternoon'
      status TEXT DEFAULT 'pending', -- 'pending', 'verified'
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Bookings Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      servant_id INTEGER NOT NULL,
      flat_type TEXT NOT NULL, -- 'bachelor', 'family'
      services TEXT NOT NULL, -- comma-separated: 'cooking,cleaning'
      monthly_rate INTEGER NOT NULL,
      start_date DATE NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(servant_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Agreements Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      terms TEXT NOT NULL,
      customer_signature TEXT, -- e.g. "Signed by Rahat Chowdhury on 2026-06-09"
      servant_signature TEXT, -- e.g. "Signed by Rokeya Begum on 2026-06-09"
      signed_at DATETIME,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Create Invoices/Payments Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      month_index INTEGER NOT NULL, -- 1 for month 1, 2 for month 2, etc.
      billing_date DATE NOT NULL,
      amount INTEGER NOT NULL,
      commission_rate REAL NOT NULL, -- 0.30 for first month, 0.15 for rest
      commission_amount INTEGER NOT NULL,
      servant_payout INTEGER NOT NULL,
      payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid'
      payment_method TEXT, -- 'bKash', 'Nagad', 'Card'
      payment_txid TEXT,
      paid_at DATETIME,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Seed Admin if not exists
  const adminExists = await dbGet('SELECT * FROM users WHERE role = ?', ['admin']);
  if (!adminExists) {
    console.log('Seeding initial data...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedCustomerPassword = await bcrypt.hash('customer123', 10);
    const hashedServantPassword = await bcrypt.hash('bua123', 10);

    // Add Admin
    await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      ['01711111111', 'Admin Boss', 'admin', hashedAdminPassword]
    );

    // Add Customer
    const customerResult = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      ['01822222222', 'Rahat Chowdhury', 'customer', hashedCustomerPassword]
    );
    const customerId = customerResult.lastID;

    // Add Servants
    // Bua 1: Rokeya Begum (Verified, Part-time, Cook/Clean, Block A, B, I)
    const bua1Result = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      ['01911223344', 'Rokeya Begum', 'servant', hashedServantPassword]
    );
    const bua1Id = bua1Result.lastID;
    await dbRun(
      `INSERT INTO servant_profiles (user_id, nid, nid_front, nid_back, type, skills, rate, locations, time_slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bua1Id,
        '4589201456',
        '/uploads/nid_mock_front.png',
        '/uploads/nid_mock_back.png',
        'part_time',
        'cooking,cleaning',
        2000,
        'Block A,Block B,Block I',
        'Morning (8:00 AM - 11:00 AM),Afternoon (2:00 PM - 5:00 PM)',
        'verified'
      ]
    );

    // Bua 2: Moriom Khatun (Verified, Full-time, Cooking/Cleaning/Washing, Block C, D, I, G)
    const bua2Result = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      ['01755667788', 'Moriom Khatun', 'servant', hashedServantPassword]
    );
    const bua2Id = bua2Result.lastID;
    await dbRun(
      `INSERT INTO servant_profiles (user_id, nid, nid_front, nid_back, type, skills, rate, locations, time_slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bua2Id,
        '8795412543',
        '/uploads/nid_mock_front.png',
        '/uploads/nid_mock_back.png',
        'full_time',
        'cooking,cleaning,washing',
        8500,
        'Block C,Block D,Block I,Block G',
        'Full Day (8:00 AM - 6:00 PM)',
        'verified'
      ]
    );

    // Bua 3: Rahima Akhter (Verified, Part-time, Cooking, Block F, I, H)
    const bua3Result = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      ['01533445566', 'Rahima Akhter', 'servant', hashedServantPassword]
    );
    const bua3Id = bua3Result.lastID;
    await dbRun(
      `INSERT INTO servant_profiles (user_id, nid, nid_front, nid_back, type, skills, rate, locations, time_slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bua3Id,
        '1245789654',
        '/uploads/nid_mock_front.png',
        '/uploads/nid_mock_back.png',
        'part_time',
        'cooking',
        1200,
        'Block F,Block I,Block H',
        'Morning (7:30 AM - 9:30 AM),Evening (6:00 PM - 8:00 PM)',
        'verified'
      ]
    );

    // Bua 4: Lipi Begum (Pending Verification, Part-time, Cleaning/Washing, Block B, C)
    const bua4Result = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      ['01699887766', 'Lipi Begum', 'servant', hashedServantPassword]
    );
    const bua4Id = bua4Result.lastID;
    await dbRun(
      `INSERT INTO servant_profiles (user_id, nid, nid_front, nid_back, type, skills, rate, locations, time_slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bua4Id,
        '9658231478',
        '/uploads/nid_mock_front_pending.png',
        '/uploads/nid_mock_back_pending.png',
        'part_time',
        'cleaning,washing',
        1800,
        'Block B,Block C',
        'Afternoon (1:00 PM - 4:00 PM)',
        'pending'
      ]
    );

    // Create a mock active booking for Rahat Chowdhury with Rokeya Begum
    const bookingResult = await dbRun(
      `INSERT INTO bookings (customer_id, servant_id, flat_type, services, monthly_rate, start_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        bua1Id,
        'bachelor',
        'cooking,cleaning',
        2000,
        '2026-05-09', // active since last month
        'active'
      ]
    );
    const bookingId = bookingResult.lastID;

    // Create agreement for that booking
    await dbRun(
      `INSERT INTO agreements (booking_id, terms, customer_signature, servant_signature, signed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        bookingId,
        'Agreement between Rahat Chowdhury (Customer) and Rokeya Begum (Servant). Servant will perform cooking and cleaning in Bashundhara Block I. Monthly rate is ৳2,000. Customer agrees to pay the platform directly every month. Platform commission of 30% applies in the 1st month, and 15% subsequently.',
        'Signed by Rahat Chowdhury',
        'Signed by Rokeya Begum',
        '2026-05-09 11:00:00'
      ]
    );

    // Create an unpaid invoice for the first month
    await dbRun(
      `INSERT INTO invoices (booking_id, month_index, billing_date, amount, commission_rate, commission_amount, servant_payout, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        1, // 1st Month (30% commission)
        '2026-06-09',
        2000,
        0.30,
        600, // 30% of 2000
        1400,
        'unpaid'
      ]
    );

    console.log('Database seeded successfully.');
  } else {
    console.log('Database already initialized and seeded.');
  }
}

module.exports = {
  initDb,
  dbRun,
  dbAll,
  dbGet
};
