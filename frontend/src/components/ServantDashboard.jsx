import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, HelpCircle, FileText, CheckCircle, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';

export default function ServantDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [viewingAgreement, setViewingAgreement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchJobs();
    fetchInvoices();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setProfile(data.profile);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/bookings/servant', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setJobs(data);
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

  const handleSignAgreement = async (bookingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/agreement/${bookingId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        fetchJobs();
        setViewingAgreement(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate wallet aggregates
  const totalVolume = invoices.reduce((sum, inv) => sum + (inv.payment_status === 'paid' ? inv.amount : 0), 0);
  const totalCommission = invoices.reduce((sum, inv) => sum + (inv.payment_status === 'paid' ? inv.commission_amount : 0), 0);
  const totalPayout = invoices.reduce((sum, inv) => sum + (inv.payment_status === 'paid' ? inv.servant_payout : 0), 0);
  const pendingPayout = invoices.reduce((sum, inv) => sum + (inv.payment_status === 'unpaid' ? inv.servant_payout : 0), 0);

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Verification Status Header */}
      {profile && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.5rem 2rem', 
            marginBottom: '2rem', 
            borderLeft: `5px solid ${profile.status === 'verified' ? 'var(--accent-teal)' : '#f59e0b'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: 'white' }}>
                Servant Portal (বুয়া ড্যাশবোর্ড)
              </h2>
              {profile.status === 'verified' ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <ShieldCheck size={12} /> Verified (নিবন্ধিত বুয়া)
                </span>
              ) : (
                <span className="badge badge-pending">
                  ⌛ Pending Verification (অপেক্ষমান)
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              NID Number: <b>{profile.nid}</b> | Working Type: <b>{profile.type === 'full_time' ? 'Full Time' : 'Part Time'}</b>
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location Preferences:</span>
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem' }}>
              {profile.locations.split(',').map(l => (
                <span key={l} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card 1: Total Billed */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gross Billed Volume</span>
            <h4 style={{ fontSize: '1.5rem', color: 'white', marginTop: '0.2rem' }}>৳{totalVolume}</h4>
          </div>
        </div>

        {/* Card 2: Platform Commission */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '10px', color: '#ef4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Platform Commission Paid</span>
            <h4 style={{ fontSize: '1.5rem', color: 'white', marginTop: '0.2rem' }}>৳{totalCommission}</h4>
          </div>
        </div>

        {/* Card 3: Payout Settled */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '10px', color: 'var(--accent-teal)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payouts Settled</span>
            <h4 style={{ fontSize: '1.5rem', color: 'white', marginTop: '0.2rem' }}>৳{totalPayout}</h4>
          </div>
        </div>

        {/* Card 4: Payout Pending */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '10px', color: '#f59e0b' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payouts Pending</span>
            <h4 style={{ fontSize: '1.5rem', color: 'white', marginTop: '0.2rem' }}>৳{pendingPayout}</h4>
          </div>
        </div>
      </div>

      <div className="grid-2">
        
        {/* Left Side: Job allocation */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.2rem' }}>
            🏠 Current Job Bookings & Work Agreements
          </h3>

          {jobs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
              No active job assignments found. Once customer books you, it will appear here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {jobs.map((job) => (
                <div 
                  key={job.booking_id} 
                  style={{ 
                    padding: '1.2rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    background: 'rgba(255,255,255,0.01)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: 'white', fontSize: '1rem' }}>Customer: {job.customer_name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        📞 Phone: <b>{job.customer_phone}</b>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-secondary)' }}>
                        Flat Category: <b style={{ color: 'white', textTransform: 'capitalize' }}>{job.flat_type}</b>
                      </span>
                      <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Salary: <b style={{ color: 'var(--accent-teal)' }}>৳{job.monthly_rate}</b>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.4rem' }}>
                    {job.services.split(',').map(s => (
                      <span key={s} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'capitalize' }}>
                        {s}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Start: {job.start_date}
                    </span>
                    
                    {job.servant_signature ? (
                      <button 
                        onClick={() => setViewingAgreement(job)} 
                        className="btn-secondary" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-teal)', color: 'var(--accent-teal)' }}
                      >
                        ✓ Agreement Signed
                      </button>
                    ) : (
                      <button 
                        onClick={() => setViewingAgreement(job)} 
                        className="btn-primary" 
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', background: 'var(--primary)' }}
                      >
                        ⚠️ Review & Sign Contract
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Wallet Statement Ledger */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '0.4rem' }}>
            📊 Platform Ledger & Commission Statement
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.2rem' }}>
            Commission policy: First month <b>30%</b> fee. Rest months <b>15%</b> fee.
          </p>

          {invoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
              No statements found yet.
            </p>
          ) : (
            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Invoice Cycle</th>
                    <th>Salary</th>
                    <th>Platform Fee</th>
                    <th>My Net Payout</th>
                    <th>Payout Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <b>Month {inv.month_index}</b>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inv.billing_date}</span>
                      </td>
                      <td>৳{inv.amount}</td>
                      <td style={{ color: '#f87171' }}>
                        -{inv.commission_amount} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({inv.commission_rate * 100}%)</span>
                      </td>
                      <td style={{ color: 'var(--accent-teal)', fontWeight: '700' }}>
                        ৳{inv.servant_payout}
                      </td>
                      <td>
                        <span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : 'badge-pending'}`}>
                          {inv.payment_status === 'paid' ? 'Settled' : 'Awaiting Cust'}
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
                  {viewingAgreement.customer_signature ? '✓ Signed' : '⌛ Pending'}
                </p>
              </div>

              <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Servant Signature Status:</span>
                <p style={{ fontSize: '0.85rem', color: viewingAgreement.servant_signature ? 'var(--accent-teal)' : '#f59e0b', fontWeight: '600', marginTop: '0.25rem' }}>
                  {viewingAgreement.servant_signature ? '✓ Signed' : '⌛ Pending'}
                </p>
                {viewingAgreement.servant_signature && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{viewingAgreement.servant_signature}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingAgreement(null)} className="btn-secondary">
                Close Contract
              </button>
              
              {!viewingAgreement.servant_signature && (
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

    </div>
  );
}
