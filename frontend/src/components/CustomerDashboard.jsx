import React, { useState, useEffect } from 'react';
import BashundharaMap from './BashundharaMap';
import PaymentModal from './PaymentModal';
import { Search, User, Phone, MapPin, Calendar, FileText, CheckCircle, CreditCard, DollarSign } from 'lucide-react';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'bookings'
  const [selectedBlock, setSelectedBlock] = useState('Block I');
  const [skillFilter, setSkillFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [servants, setServants] = useState([]);
  
  // Modal states
  const [selectedServant, setSelectedServant] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [flatType, setFlatType] = useState('bachelor'); // 'bachelor' or 'family'
  const [bookingServices, setBookingServices] = useState({ cooking: true, cleaning: true, washing: false });
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Bookings / Agreements / Invoices states
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [viewingAgreement, setViewingAgreement] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Fetch search results when filter/block changes
  useEffect(() => {
    fetchServants();
  }, [selectedBlock, skillFilter, typeFilter]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
      fetchInvoices();
    }
  }, [activeTab]);

  const fetchServants = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedBlock) query.append('block', selectedBlock);
      if (skillFilter) query.append('skill', skillFilter);
      if (typeFilter) query.append('type', typeFilter);

      const res = await fetch(`http://localhost:5000/api/servants/search?${query.toString()}`);
      const data = await res.json();
      if (res.ok) setServants(data);
    } catch (err) {
      console.error('Failed to fetch servants', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/bookings/customer', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setBookings(data);
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

  const calculateBookingRate = () => {
    if (!selectedServant) return 0;
    const selectedCount = Object.values(bookingServices).filter(Boolean).length;
    if (flatType === 'bachelor') {
      // 1000 Taka per selected work
      return selectedCount * 1000;
    } else {
      // Family Flat: 1300 Taka per selected work
      return selectedCount * 1300;
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedServant) return;
    setLoading(true);
    setMsg('');

    const servicesList = Object.entries(bookingServices)
      .filter(([_, checked]) => checked)
      .map(([skill]) => skill)
      .join(',');

    if (!servicesList) {
      setMsg('⚠️ Please select at least one service to book.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          servantId: selectedServant.id,
          flatType,
          services: servicesList,
          monthlyRate: calculateBookingRate(),
          startDate
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMsg('🎉 Booking request submitted and first invoice generated! Please sign the agreement.');
        setTimeout(() => {
          setShowBookingModal(false);
          setSelectedServant(null);
          setMsg('');
          setActiveTab('bookings');
        }, 2500);
      } else {
        setMsg(`⚠️ ${data.error}`);
      }
    } catch (err) {
      setLoading(false);
      setMsg('⚠️ Network error. Please try again.');
    }
  };

  const handleSignAgreement = async (bookingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/agreement/${bookingId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        fetchBookings();
        setViewingAgreement(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Dashboard Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)' }}>Customer Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Book premium verified বুয়া inside Bashundhara R/A
          </p>
        </div>
        
        {/* Navigation tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(17, 24, 39, 0.6)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'search' ? 'var(--primary)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              transition: 'var(--transition-smooth)'
            }}
          >
            Find a Bua
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'bookings' ? 'var(--primary)' : 'transparent',
              color: 'white',
              fontWeight: '600',
              transition: 'var(--transition-smooth)'
            }}
          >
            My Bookings & Invoices
          </button>
        </div>
      </div>

      {activeTab === 'search' ? (
        /* TAB: SEARCH AND MAP SELECTOR */
        <div className="grid-2">
          {/* Map Column */}
          <div>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem' }}>
                📍 Bashundhara R/A Block Selector
              </h3>
              
              <BashundharaMap 
                selectedBlocks={selectedBlock ? [selectedBlock] : []} 
                onSelectBlock={(block) => setSelectedBlock(block)} 
              />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Work Type</label>
                  <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="part_time">Part-time (পার্ট টাইম)</option>
                    <option value="full_time">Full-time (ফুল টাইম)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Skill Requirement</label>
                  <select className="input-field" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
                    <option value="">Any Work</option>
                    <option value="cooking">🍳 Cooking</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="washing">🧺 Washing</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div>
            <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white' }}>
                  Available Servants ({selectedBlock || 'All Blocks'})
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Found {servants.length} matches
                </span>
              </div>

              {servants.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧹</span>
                  <p>No servants available in this block.</p>
                  <p style={{ fontSize: '0.8rem' }}>Try choosing another block or clearing filters.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {servants.map((servant) => (
                    <div 
                      key={servant.id} 
                      className="glass-card-interactive animate-fade-in"
                      onClick={() => { setSelectedServant(servant); setShowBookingModal(true); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                            {servant.name}
                          </h4>
                          <span className={`badge ${servant.type === 'full_time' ? 'badge-success' : 'badge-pending'}`} style={{ marginRight: '0.5rem' }}>
                            {servant.type === 'full_time' ? 'Full-Time' : 'Part-Time'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            📞 {servant.phone}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>
                            ৳{servant.rate}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Base rate/month
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {servant.skills.split(',').map(s => (
                          <span key={s} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                            {s === 'cooking' ? '🍳 Cooking' : s === 'cleaning' ? '🧹 Cleaning' : '🧺 Washing'}
                          </span>
                        ))}
                      </div>

                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} />
                        Preferred Blocks: {servant.locations}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB: MY BOOKINGS & BILLING AGREEMENTS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Bookings section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.2rem' }}>
              📝 Active Domestic Help & Agreements
            </h3>

            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                You have no active servant bookings. Go to "Find a Bua" to hire.
              </p>
            ) : (
              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Bua Name</th>
                      <th>Phone</th>
                      <th>Flat Category</th>
                      <th>Services</th>
                      <th>Monthly Rate</th>
                      <th>Agreement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.booking_id}>
                        <td><b>{b.servant_name}</b></td>
                        <td>{b.servant_phone}</td>
                        <td style={{ textTransform: 'capitalize' }}>{b.flat_type} Flat</td>
                        <td style={{ textTransform: 'capitalize' }}>{b.services.split(',').join(', ')}</td>
                        <td>৳{b.monthly_rate}/mo</td>
                        <td>
                          {b.customer_signature ? (
                            <button 
                              onClick={() => setViewingAgreement(b)} 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--accent-teal)', color: 'var(--accent-teal)' }}
                            >
                              ✓ Signed Agreement
                            </button>
                          ) : (
                            <button 
                              onClick={() => setViewingAgreement(b)} 
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--primary)' }}
                            >
                              ⚠️ Sign Agreement
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices and Payments Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.2rem' }}>
              💳 Monthly Invoices & Platform Billings
            </h3>

            {invoices.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                No invoices found. Bills will populate at the end of the working month.
              </p>
            ) : (
              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Bua Name</th>
                      <th>Services</th>
                      <th>Billing Date</th>
                      <th>Month #</th>
                      <th>Bill Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.servant_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{inv.services.split(',').join(', ')}</td>
                        <td>{inv.billing_date}</td>
                        <td>Month {inv.month_index}</td>
                        <td><b>৳{inv.amount}</b></td>
                        <td>
                          <span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : 'badge-pending'}`}>
                            {inv.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          {inv.payment_status === 'unpaid' ? (
                            <button 
                              onClick={() => setPayingInvoice(inv)}
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <CreditCard size={14} /> Pay Now
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              TXID: <code style={{ color: 'var(--accent-teal)' }}>{inv.payment_txid}</code>
                            </span>
                          )}
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

      {/* MODAL: BOOKING CONFIGURATOR */}
      {showBookingModal && selectedServant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 16, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 1500 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem', margin: 'auto', position: 'relative' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '0.5rem' }}>Book {selectedServant.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Setup your contract terms and flat configurations inside Bashundhara.
            </p>

            {msg && (
              <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>
                {msg}
              </div>
            )}

            {/* Flat Type selection */}
            <div className="input-group">
              <label className="input-label">Flat Category</label>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  onClick={() => setFlatType('bachelor')}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    background: flatType === 'bachelor' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${flatType === 'bachelor' ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🙋‍♂️ Bachelor Flat
                </button>
                <button
                  onClick={() => setFlatType('family')}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    background: flatType === 'family' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${flatType === 'family' ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  👨‍👩‍👧‍👦 Family Flat
                </button>
              </div>
            </div>

            {/* Unified task calculator */}
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '1.2rem' }}>
              <label className="input-label" style={{ marginBottom: '0.8rem' }}>
                Select Tasks (৳{flatType === 'bachelor' ? '1,000' : '1,300'} Taka per task per head payment)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['cooking', 'cleaning', 'washing'].map((task) => {
                  const isAvailable = selectedServant.skills.split(',').includes(task);
                  return (
                    <label key={task} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: isAvailable ? 'white' : 'var(--text-muted)', cursor: isAvailable ? 'pointer' : 'not-allowed', textTransform: 'capitalize', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        disabled={!isAvailable}
                        checked={bookingServices[task] && isAvailable}
                        onChange={() => setBookingServices(prev => ({ ...prev, [task]: !prev[task] }))}
                      />
                      {task === 'cooking' ? '🍳 Cooking Task' : task === 'cleaning' ? '🧹 Cleaning Room and Kitchen' : '🧺 Washing Clothes'}
                      {!isAvailable && ' (Not offered by this Bua)'}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Services Start Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Total rate display */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculated Salary / Month:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-teal)' }}>
                ৳{calculateBookingRate()}
              </span>
            </div>

            <div 
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                lineHeight: '1.3',
                marginBottom: '1.5rem'
              }}
            >
              🔒 <b>Billing Policy:</b> Salaries are processed exclusively through our digital panel. Direct cash handouts are forbidden and void liability cover.
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowBookingModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleCreateBooking} className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Processing...' : 'Confirm & Generate Contract'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW & SIGN AGREEMENT */}
      {viewingAgreement && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 16, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 1500 }}>
          <div className="glass-panel" style={{ width: '95%', maxWidth: '600px', padding: '2.5rem', margin: 'auto', position: 'relative' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> BuaBondhu Digital Agreement Contract
            </h3>

            <pre 
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '1.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                maxHeight: '300px',
                overflowY: 'auto',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                marginBottom: '1.5rem'
              }}
            >
              {viewingAgreement.terms}
            </pre>

            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Signature Status:</span>
                <p style={{ fontSize: '0.85rem', color: viewingAgreement.customer_signature ? 'var(--accent-teal)' : '#f59e0b', fontWeight: '600', marginTop: '0.25rem' }}>
                  {viewingAgreement.customer_signature ? '✓ Signed Digitally' : '⌛ Pending Signature'}
                </p>
                {viewingAgreement.customer_signature && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{viewingAgreement.customer_signature}</p>}
              </div>

              <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Servant Signature Status:</span>
                <p style={{ fontSize: '0.85rem', color: viewingAgreement.servant_signature ? 'var(--accent-teal)' : '#f59e0b', fontWeight: '600', marginTop: '0.25rem' }}>
                  {viewingAgreement.servant_signature ? '✓ Signed Digitally' : '⌛ Pending Signature'}
                </p>
                {viewingAgreement.servant_signature && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{viewingAgreement.servant_signature}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingAgreement(null)} className="btn-secondary">
                Close Contract
              </button>
              
              {!viewingAgreement.customer_signature && (
                <button 
                  onClick={() => handleSignAgreement(viewingAgreement.booking_id)} 
                  className="btn-primary"
                  style={{ background: 'var(--accent-teal)' }}
                >
                  Sign Agreement Contract
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOCK CHECKOUT PORTAL */}
      {payingInvoice && (
        <PaymentModal 
          invoice={payingInvoice} 
          onClose={() => setPayingInvoice(null)} 
          onPaymentSuccess={() => {
            setPayingInvoice(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
