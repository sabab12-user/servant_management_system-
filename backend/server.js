const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDb, dbRun, dbAll, dbGet } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bua_management_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support base64 uploads

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Check role middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role action' });
    }
    next();
  };
};

// --- AUTH ROUTES ---

// Simulate OTP Send
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });
  
  // In a real system we'd call SSL Wireless or Greenweb SMS API.
  // For sandbox, we'll return a simulated successful send.
  console.log(`Sending simulated OTP 1234 to phone: ${phone}`);
  res.json({ success: true, message: 'OTP sent successfully (Simulated: 1234)' });
});

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { phone, name, password, role, otp, nid, nidFront, nidBack, type, skills, rate, locations, timeSlots } = req.body;

  if (!phone || !name || !password || !role) {
    return res.status(400).json({ error: 'Phone, Name, Password, and Role are required' });
  }

  // Verify simulated OTP
  if (role === 'servant' && otp !== '1234') {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  try {
    const userExists = await dbGet('SELECT * FROM users WHERE phone = ?', [phone]);
    if (userExists) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      [phone, name, role, hashedPassword]
    );
    const userId = result.lastID;

    // If servant, create profile
    if (role === 'servant') {
      if (!nid || !type || !skills || !rate || !locations || !timeSlots) {
        // Rollback user
        await dbRun('DELETE FROM users WHERE id = ?', [userId]);
        return res.status(400).json({ error: 'Missing required servant profile fields' });
      }

      // Save NID front and back (could be base64 strings or files)
      let nidFrontUrl = nidFront;
      let nidBackUrl = nidBack;

      if (nidFront && nidFront.startsWith('data:image')) {
        const frontBuffer = Buffer.from(nidFront.split(',')[1], 'base64');
        const frontFilename = `nid_${userId}_front_${Date.now()}.png`;
        fs.writeFileSync(path.join(uploadsDir, frontFilename), frontBuffer);
        nidFrontUrl = `/uploads/${frontFilename}`;
      }

      if (nidBack && nidBack.startsWith('data:image')) {
        const backBuffer = Buffer.from(nidBack.split(',')[1], 'base64');
        const backFilename = `nid_${userId}_back_${Date.now()}.png`;
        fs.writeFileSync(path.join(uploadsDir, backFilename), backBuffer);
        nidBackUrl = `/uploads/${backFilename}`;
      }

      await dbRun(
        `INSERT INTO servant_profiles (user_id, nid, nid_front, nid_back, type, skills, rate, locations, time_slots, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, nid, nidFrontUrl, nidBackUrl, type, skills, rate, locations, timeSlots]
      );
    }

    const token = jwt.sign({ id: userId, phone, role, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, phone, name, role } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

  try {
    const user = await dbGet('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) return res.status(400).json({ error: 'Invalid phone or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid phone or password' });

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, phone, name, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'servant') {
      profile = await dbGet('SELECT * FROM servant_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// --- SERVANTS ROUTES ---

// Search Servants (Leaflet map block-selection integration)
app.get('/api/servants/search', async (req, res) => {
  const { block, skill, type } = req.query; // Block A to N, skills (cooking, cleaning, washing), type (part_time, full_time)

  try {
    let query = `
      SELECT u.id, u.name, u.phone, sp.type, sp.skills, sp.rate, sp.locations, sp.time_slots, sp.status
      FROM users u
      JOIN servant_profiles sp ON u.id = sp.user_id
      WHERE sp.status = 'verified'
    `;
    const params = [];

    if (type) {
      query += ` AND sp.type = ?`;
      params.push(type);
    }

    const rows = await dbAll(query, params);

    // Client-side filtering for comma-separated fields: locations and skills
    let filtered = rows;

    if (block) {
      filtered = filtered.filter(row => 
        row.locations.split(',').map(l => l.trim().toLowerCase()).includes(block.trim().toLowerCase())
      );
    }

    if (skill) {
      filtered = filtered.filter(row => 
        row.skills.split(',').map(s => s.trim().toLowerCase()).includes(skill.trim().toLowerCase())
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search servants' });
  }
});

// Admin Route: Add servant manually
app.post('/api/servants/manual-add', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { name, phone, nid, type, skills, rate, locations, timeSlots } = req.body;

  if (!name || !phone || !nid || !type || !skills || !rate || !locations || !timeSlots) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const userExists = await dbGet('SELECT * FROM users WHERE phone = ?', [phone]);
    if (userExists) return res.status(400).json({ error: 'Phone already registered' });

    // Generate dummy password for manually entered servant
    const dummyPassword = await bcrypt.hash('bua123', 10);

    const result = await dbRun(
      'INSERT INTO users (phone, name, role, password) VALUES (?, ?, ?, ?)',
      [phone, name, 'servant', dummyPassword]
    );
    const userId = result.lastID;

    await dbRun(
      `INSERT INTO servant_profiles (user_id, nid, nid_front, nid_back, type, skills, rate, locations, time_slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified')`,
      [userId, nid, '/uploads/nid_manual.png', '/uploads/nid_manual.png', type, skills, rate, locations, timeSlots]
    );

    res.json({ success: true, message: 'Servant added manually and auto-verified' });
  } catch (error) {
    console.error('Manual add error:', error);
    res.status(500).json({ error: 'Failed to add servant manually' });
  }
});

// Admin Route: Get pending verification list
app.get('/api/admin/pending-servants', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT u.id, u.name, u.phone, sp.nid, sp.nid_front, sp.nid_back, sp.type, sp.skills, sp.rate, sp.locations, sp.time_slots, sp.status
      FROM users u
      JOIN servant_profiles sp ON u.id = sp.user_id
      WHERE sp.status = 'pending'
    `);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pending list' });
  }
});

// Admin Route: Verify servant NID
app.post('/api/admin/verify-servant', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { servantId, action } = req.body; // action: 'approve' or 'reject'

  if (!servantId || !action) return res.status(400).json({ error: 'Servant ID and action required' });

  try {
    if (action === 'approve') {
      await dbRun("UPDATE servant_profiles SET status = 'verified' WHERE user_id = ?", [servantId]);
      res.json({ success: true, message: 'Servant verified successfully' });
    } else {
      await dbRun("UPDATE servant_profiles SET status = 'rejected' WHERE user_id = ?", [servantId]);
      res.json({ success: true, message: 'Servant registration rejected' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification update failed' });
  }
});

// --- BOOKING & AGREEMENT ROUTES ---

// Create Booking
app.post('/api/bookings/create', authenticateToken, requireRole(['customer']), async (req, res) => {
  const { servantId, flatType, services, monthlyRate, startDate } = req.body;

  if (!servantId || !flatType || !services || !monthlyRate || !startDate) {
    return res.status(400).json({ error: 'All booking fields are required' });
  }

  try {
    // Check if servant exists and is verified
    const servant = await dbGet(`
      SELECT u.name, sp.status, sp.type FROM users u 
      JOIN servant_profiles sp ON u.id = sp.user_id 
      WHERE u.id = ?
    `, [servantId]);

    if (!servant || servant.status !== 'verified') {
      return res.status(400).json({ error: 'Servant is not available or verified' });
    }

    const customerName = req.user.name;

    // Create booking
    const result = await dbRun(
      `INSERT INTO bookings (customer_id, servant_id, flat_type, services, monthly_rate, start_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [req.user.id, servantId, flatType, services, monthlyRate, startDate]
    );
    const bookingId = result.lastID;

    // Auto-generate agreement terms
    const terms = `DIGITAL AGREEMENT
This agreement is entered into on ${startDate} between:
Customer: ${customerName} (ID: ${req.user.id})
Servant: ${servant.name} (ID: ${servantId})

Service Category: ${flatType} Flat (${servant.type === 'full_time' ? 'Full Time' : 'Part Time'})
Services Selected: ${services}
Agreed Monthly Remuneration: ৳${monthlyRate} (Bangladeshi Taka)

TERMS & CONDITIONS:
1. Payments: Customer must pay the monthly salary in full through the BuaBondhu online platform at the end of each working month. Handing cash directly to the servant is strictly prohibited and voids contract liability.
2. Platform Commission: In accordance with platform terms, the company retains 30% of the first month's salary as onboarding agency fee. From the second month onwards, a standard 15% platform maintenance fee is deducted from the payout.
3. Conduct and Dispute Resolution: Any standard dispute will be handled via the BuaBondhu admin panel. In case of any negative activities or background reviews, the platform retains verified NID numbers to coordinate with legal channels, though details are kept public-restricted.
`;

    await dbRun(
      'INSERT INTO agreements (booking_id, terms) VALUES (?, ?)',
      [bookingId, terms]
    );

    // Pre-create Invoice for Month 1 (unpaid)
    await dbRun(
      `INSERT INTO invoices (booking_id, month_index, billing_date, amount, commission_rate, commission_amount, servant_payout, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
      [
        bookingId,
        1, // month 1
        startDate, // billing starts from start_date
        monthlyRate,
        0.30, // 30% first month
        Math.round(monthlyRate * 0.30),
        Math.round(monthlyRate * 0.70),
        'unpaid'
      ]
    );

    res.json({ success: true, bookingId, message: 'Booking requested & contract terms drafted.' });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Fetch Customer's Bookings & Agreements
app.get('/api/bookings/customer', authenticateToken, requireRole(['customer']), async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT b.id as booking_id, b.flat_type, b.services, b.monthly_rate, b.start_date, b.status, 
             u.name as servant_name, u.phone as servant_phone,
             a.terms, a.customer_signature, a.servant_signature, a.signed_at
      FROM bookings b
      JOIN users u ON b.servant_id = u.id
      LEFT JOIN agreements a ON b.id = a.booking_id
      WHERE b.customer_id = ?
    `, [req.user.id]);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer bookings' });
  }
});

// Fetch Servant's Jobs
app.get('/api/bookings/servant', authenticateToken, requireRole(['servant']), async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT b.id as booking_id, b.flat_type, b.services, b.monthly_rate, b.start_date, b.status, 
             u.name as customer_name, u.phone as customer_phone,
             a.terms, a.customer_signature, a.servant_signature, a.signed_at
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN agreements a ON b.id = a.booking_id
      WHERE b.servant_id = ?
    `, [req.user.id]);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servant jobs' });
  }
});

// Sign Agreement
app.post('/api/bookings/agreement/:bookingId/sign', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;
  const signatureText = `Digitally Signed by ${req.user.name} on ${new Date().toISOString().split('T')[0]}`;

  try {
    // Check if booking belongs to current user (as customer or servant)
    const booking = await dbGet('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (req.user.role === 'customer' && booking.customer_id === req.user.id) {
      await dbRun(
        "UPDATE agreements SET customer_signature = ?, signed_at = CURRENT_TIMESTAMP WHERE booking_id = ?",
        [signatureText, bookingId]
      );
      return res.json({ success: true, message: 'Customer agreement signed' });
    } else if (req.user.role === 'servant' && booking.servant_id === req.user.id) {
      await dbRun(
        "UPDATE agreements SET servant_signature = ?, signed_at = CURRENT_TIMESTAMP WHERE booking_id = ?",
        [signatureText, bookingId]
      );
      return res.json({ success: true, message: 'Servant agreement signed' });
    } else {
      return res.status(403).json({ error: 'Unauthorized to sign this agreement' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign agreement' });
  }
});

// --- INVOICE & PAYMENT ROUTES ---

// Get Invoices for customer or servant
app.get('/api/payments/invoices', authenticateToken, async (req, res) => {
  try {
    let list = [];
    if (req.user.role === 'customer') {
      list = await dbAll(`
        SELECT i.*, u.name as servant_name, b.services, b.flat_type
        FROM invoices i
        JOIN bookings b ON i.booking_id = b.id
        JOIN users u ON b.servant_id = u.id
        WHERE b.customer_id = ?
      `, [req.user.id]);
    } else if (req.user.role === 'servant') {
      list = await dbAll(`
        SELECT i.*, u.name as customer_name, b.services, b.flat_type
        FROM invoices i
        JOIN bookings b ON i.booking_id = b.id
        JOIN users u ON b.customer_id = u.id
        WHERE b.servant_id = ?
      `, [req.user.id]);
    } else if (req.user.role === 'admin') {
      list = await dbAll(`
        SELECT i.*, c.name as customer_name, s.name as servant_name, b.services
        FROM invoices i
        JOIN bookings b ON i.booking_id = b.id
        JOIN users c ON b.customer_id = c.id
        JOIN users s ON b.servant_id = s.id
      `);
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Pay Invoice (bKash/Nagad/Rocket Sandbox Simulator)
app.post('/api/payments/pay/:invoiceId', authenticateToken, requireRole(['customer']), async (req, res) => {
  const { invoiceId } = req.params;
  const { paymentMethod, txid } = req.body; // e.g. paymentMethod: 'bKash', txid: 'BKSH123456789'

  if (!paymentMethod || !txid) {
    return res.status(400).json({ error: 'Payment method and transaction ID are required' });
  }

  try {
    const invoice = await dbGet(`
      SELECT i.*, b.customer_id FROM invoices i
      JOIN bookings b ON i.booking_id = b.id
      WHERE i.id = ?
    `, [invoiceId]);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.customer_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized payment' });
    if (invoice.payment_status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });

    // Mark current invoice as paid
    await dbRun(
      `UPDATE invoices 
       SET payment_status = 'paid', payment_method = ?, payment_txid = ?, paid_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [paymentMethod, txid, invoiceId]
    );

    // Generate NEXT month's invoice automatically (Billing agreement continuity logic)
    const nextMonthIndex = invoice.month_index + 1;
    // Monthly billing calculation: next month commission drops to 15%
    const nextCommissionRate = 0.15;
    const amount = invoice.amount;
    const commissionAmount = Math.round(amount * nextCommissionRate);
    const payoutAmount = amount - commissionAmount;

    // Calculate billing date (1 month from previous)
    const prevDate = new Date(invoice.billing_date);
    prevDate.setMonth(prevDate.getMonth() + 1);
    const nextBillingDate = prevDate.toISOString().split('T')[0];

    await dbRun(
      `INSERT INTO invoices (booking_id, month_index, billing_date, amount, commission_rate, commission_amount, servant_payout, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
      [invoice.booking_id, nextMonthIndex, nextBillingDate, amount, nextCommissionRate, commissionAmount, payoutAmount, 'unpaid']
    );

    res.json({ success: true, message: 'Payment processed successfully. Next billing cycle created.' });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// --- ADMIN DASHBOARD STATS ---
app.get('/api/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const totalCustomers = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalServants = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'servant'");
    const totalBookings = await dbGet("SELECT COUNT(*) as count FROM bookings");
    
    // Financial calculations
    const financialStats = await dbGet(`
      SELECT 
        SUM(amount) as totalVolume,
        SUM(CASE WHEN payment_status = 'paid' THEN commission_amount ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN payment_status = 'paid' THEN servant_payout ELSE 0 END) as payoutsSettled,
        SUM(CASE WHEN payment_status = 'unpaid' THEN servant_payout ELSE 0 END) as payoutsPending
      FROM invoices
    `);

    // Fetch verified/pending split
    const verifiedServants = await dbGet("SELECT COUNT(*) as count FROM servant_profiles WHERE status = 'verified'");
    const pendingServants = await dbGet("SELECT COUNT(*) as count FROM servant_profiles WHERE status = 'pending'");

    res.json({
      customers: totalCustomers.count,
      servants: totalServants.count,
      bookings: totalBookings.count,
      verifiedServants: verifiedServants.count,
      pendingServants: pendingServants.count,
      totalVolume: financialStats.totalVolume || 0,
      totalRevenue: financialStats.totalRevenue || 0,
      payoutsSettled: financialStats.payoutsSettled || 0,
      payoutsPending: financialStats.payoutsPending || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

// Start database and server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`BuaBondhu backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
