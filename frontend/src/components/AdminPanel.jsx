import React, { useState, useEffect } from 'react';
import { ShieldAlert, UserPlus, TrendingUp, Users, CheckCircle, XCircle, FileText, Image } from 'lucide-react';

const BASHUNDHARA_BLOCKS = [
  'Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Block F',
  'Block G', 'Block H', 'Block I', 'Block J', 'Block K', 'Block L',
  'Block M', 'Block N'
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'manual', 'stats'
  const [pendingList, setPendingList] = useState([]);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  
  // NID lightbox modal
  const [viewingNidUrl, setViewingNidUrl] = useState(null);

  // Manual Add Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [type, setType] = useState('part_time');
  const [skills, setSkills] = useState({ cooking: true, cleaning: true, washing: false });
  const [rate, setRate] = useState('2000');
  const [selectedBlocks, setSelectedBlocks] = useState(['Block I']);
  const [timeSlot, setTimeSlot] = useState('Morning (8:00 AM - 12:00 PM)');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'pending') fetchPending();
    if (activeTab === 'stats') {
      fetchStats();
      fetchInvoices();
    }
  }, [activeTab]);

  const fetchPending = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/pending-servants', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setPendingList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/payments/invoices', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setInvoices(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (servantId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/verify-servant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ servantId, action })
      });
      if (res.ok) {
        fetchPending();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSkill = (skill) => {
    setSkills(prev => ({ ...prev, [skill]: !prev[skill] }));
  };

  const toggleBlock = (block) => {
    if (selectedBlocks.includes(block)) {
      setSelectedBlocks(prev => prev.filter(b => b !== block));
    } else {
      setSelectedBlocks(prev => [...prev, block]);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    const skillsList = Object.entries(skills).filter(([_, v]) => v).map(([k]) => k).join(',');
    const blocksList = selectedBlocks.join(',');

    if (!name || !phone || !nid || !skillsList || !blocksList) {
      setMsg('⚠️ Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/servants/manual-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          phone,
          nid,
          type,
          skills: skillsList,
          rate: parseInt(rate),
          locations: blocksList,
          timeSlots: timeSlot
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMsg('🎉 Servant added manually and auto-verified successfully!');
        // Reset form
        setName('');
        setPhone('');
        setNid('');
        setSelectedBlocks(['Block I']);
      } else {
        setMsg(`⚠️ ${data.error}`);
      }
    } catch (err) {
      setLoading(false);
      setMsg('⚠️ Server connection error.');
    }
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Admin Navigation bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)' }}>System Administration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Verify registrations, onboard manual data, and track corporate platform revenues
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(17, 24, 39, 0.6)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'pending' ? 'var(--primary)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              transition: 'var(--transition-smooth)'
            }}
          >
            Pending Approvals ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'manual' ? 'var(--primary)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              transition: 'var(--transition-smooth)'
            }}
          >
            Manual Onboard
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'stats' ? 'var(--primary)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              transition: 'var(--transition-smooth)'
            }}
          >
            Rev & Ledger
          </button>
        </div>
      </div>

      {activeTab === 'pending' ? (
        /* TAB: PENDING VERIFICATION */
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} color="var(--primary)" /> Pending Servant Verifications
          </h3>

          {pendingList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</span>
              <p>No servants currently awaiting verification.</p>
            </div>
          ) : (
            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Bua Name</th>
                    <th>Phone</th>
                    <th>NID Number</th>
                    <th>NID Documents</th>
                    <th>Skills / Rate</th>
                    <th>Preferred Blocks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((servant) => (
                    <tr key={servant.id}>
                      <td><b>{servant.name}</b></td>
                      <td>{servant.phone}</td>
                      <td><code>{servant.nid}</code></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            onClick={() => setViewingNidUrl(`http://localhost:5000${servant.nid_front}`)} 
                            className="btn-secondary" 
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Image size={12} /> Front Card
                          </button>
                          <button 
                            onClick={() => setViewingNidUrl(`http://localhost:5000${servant.nid_back}`)} 
                            className="btn-secondary" 
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <Image size={12} /> Back Card
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                          {servant.skills.split(',').join(', ')}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '700', marginTop: '0.1rem' }}>
                          ৳{servant.rate}/mo preferred
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {servant.locations}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            onClick={() => handleVerify(servant.id, 'approve')} 
                            className="btn-primary" 
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: 'var(--accent-teal)' }}
                          >
                            Approve Verify
                          </button>
                          <button 
                            onClick={() => handleVerify(servant.id, 'reject')} 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderColor: '#f87171', color: '#f87171' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'manual' ? (
        /* TAB: MANUAL ONBOARDING */
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="var(--primary)" /> Manual Servant Registry
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Add servant details manually. Their profile will be auto-verified and active immediately.
          </p>

          {msg && (
            <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1.2rem', textAlign: 'center' }}>
              {msg}
            </div>
          )}

          <form onSubmit={handleManualAdd}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Servant Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Rokeya Begum"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="017XXXXXXXX"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">NID Card Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="10-digit card number"
                  maxLength={10}
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Working Type</label>
                <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="part_time">Part-time (পার্ট টাইম)</option>
                  <option value="full_time">Full-time (ফুল টাইম)</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Preferred Rate (৳)</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Time Slots (Manual)</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Skills checklist */}
            <div className="input-group">
              <label className="input-label">Work Offerings</label>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                {['cooking', 'cleaning', 'washing'].map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.5rem',
                      background: skills[skill] ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${skills[skill] ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: '6px',
                      color: skills[skill] ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.85rem',
                      textTransform: 'capitalize'
                    }}
                  >
                    {skill === 'cooking' ? '🍳 Cooking' : skill === 'cleaning' ? '🧹 Cleaning' : '🧺 Washing'}
                  </button>
                ))}
              </div>
            </div>

            {/* Block selection */}
            <div className="input-group">
              <label className="input-label">Available Blocks in Bashundhara (Select Multiple)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {BASHUNDHARA_BLOCKS.map(block => (
                  <span
                    key={block}
                    onClick={() => toggleBlock(block)}
                    className={`badge ${selectedBlocks.includes(block) ? 'badge-success' : ''}`}
                    style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: selectedBlocks.includes(block) ? 'var(--primary)' : 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem' }}
                  >
                    {block}
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Adding Servant...' : 'Add and Verify Servant'}
            </button>
          </form>
        </div>
      ) : (
        /* TAB: STATS & FINANCIAL REVENUE LOGS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--primary)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customers Joined</span>
                  <h4 style={{ fontSize: '1.4rem', color: 'white', marginTop: '0.2rem' }}>{stats.customers}</h4>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--accent-teal)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Verified / Pending Servants</span>
                  <h4 style={{ fontSize: '1.4rem', color: 'white', marginTop: '0.2rem' }}>{stats.verifiedServants} / {stats.pendingServants}</h4>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '10px', color: '#f59e0b' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bookings Placed</span>
                  <h4 style={{ fontSize: '1.4rem', color: 'white', marginTop: '0.2rem' }}>{stats.bookings}</h4>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--accent-teal)' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Corporate Net Commission Revenue</span>
                  <h4 style={{ fontSize: '1.4rem', color: 'var(--accent-teal)', marginTop: '0.2rem' }}>৳{stats.totalRevenue}</h4>
                </div>
              </div>
            </div>
          )}

          {/* Platform Invoice Audits */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.2rem' }}>
              📜 System-Wide Transaction Audit Ledger
            </h3>

            {invoices.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                No platform billing statements found.
              </p>
            ) : (
              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Servant Name</th>
                      <th>Billing Month</th>
                      <th>Bill Volume</th>
                      <th>Commission Share</th>
                      <th>Servant Payout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.customer_name}</td>
                        <td>{inv.servant_name}</td>
                        <td>Month {inv.month_index} <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inv.billing_date}</span></td>
                        <td>৳{inv.amount}</td>
                        <td style={{ color: '#f87171' }}>
                          ৳{inv.commission_amount} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({inv.commission_rate * 100}%)</span>
                        </td>
                        <td style={{ color: 'var(--accent-teal)' }}>
                          ৳{inv.servant_payout}
                        </td>
                        <td>
                          <span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : 'badge-pending'}`}>
                            {inv.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR NID VERIFICATION */}
      {viewingNidUrl && (
        <div 
          onClick={() => setViewingNidUrl(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 16, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, cursor: 'zoom-out' }}
        >
          <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
            <img 
              src={viewingNidUrl} 
              alt="NID Lightbox Document" 
              onError={(e) => {
                // If local NID is not uploaded, fallback to a beautiful simulated NID SVG card!
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%231e293b' rx='10'/><text x='20' y='40' fill='white' font-family='sans-serif' font-weight='bold'>GOVERNMENT NID CARD</text><rect x='20' y='70' width='80' height='100' fill='%23475569'/><text x='120' y='95' fill='white' font-family='sans-serif' font-size='12'>NAME: ROKEYA BEGUM</text><text x='120' y='125' fill='white' font-family='sans-serif' font-size='12'>NID NO: 4589201456</text><text x='120' y='155' fill='white' font-family='sans-serif' font-size='12'>STATUS: PLATFORM VERIFICATION CARD</text></svg>";
              }}
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} 
            />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.85rem' }}>
              Click anywhere to close document viewer
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
