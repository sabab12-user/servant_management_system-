import React, { useState } from 'react';
import { Shield, Smartphone, Key, User, FileText, CheckCircle } from 'lucide-react';

const BASHUNDHARA_BLOCKS = [
  'Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Block F',
  'Block G', 'Block H', 'Block I', 'Block J', 'Block K', 'Block L',
  'Block M', 'Block N'
];

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('customer'); // 'customer' or 'servant' or 'admin'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Servant Details
  const [regStep, setRegStep] = useState(1); // 1: Personal, 2: Work Preferences, 3: Verification
  const [nid, setNid] = useState('');
  const [type, setType] = useState('part_time');
  const [skills, setSkills] = useState({ cooking: false, cleaning: false, washing: false });
  const [rate, setRate] = useState('1500');
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [timeSlots, setTimeSlots] = useState({ morning: false, afternoon: false, evening: false });
  
  // Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [nidFront, setNidFront] = useState(null);
  const [nidBack, setNidBack] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const toggleTimeSlot = (slot) => {
    setTimeSlots(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  // NID Image Helper to read base64
  const handleNidUpload = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') setNidFront(reader.result);
      else setNidBack(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setError('Please enter your phone number first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setOtpSent(true);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to connect to OTP service.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Is the backend running?');
    }
  };

  const handleRegister = async () => {
    setError('');

    // Payload validation
    if (role === 'servant') {
      if (regStep === 1) {
        if (!name || !phone || !password) {
          setError('Please fill in all basic fields');
          return;
        }
        setRegStep(2);
        return;
      }
      if (regStep === 2) {
        const hasSkill = Object.values(skills).some(Boolean);
        if (!hasSkill) {
          setError('Please select at least one skill category');
          return;
        }
        if (selectedBlocks.length === 0) {
          setError('Please select at least one available Bashundhara block');
          return;
        }
        const hasTime = Object.values(timeSlots).some(Boolean);
        if (!hasTime) {
          setError('Please select at least one available time slot');
          return;
        }
        setRegStep(3);
        return;
      }
      if (regStep === 3) {
        if (!nid) {
          setError('NID number is required for security checks');
          return;
        }
        if (!nidFront || !nidBack) {
          setError('Please upload pictures of both sides of your NID card');
          return;
        }
        if (otpCode !== '1234') {
          setError('Invalid OTP code. Enter 1234 to bypass sandbox.');
          return;
        }
      }
    } else {
      // Customer registration validation
      if (!name || !phone || !password) {
        setError('Please fill in all fields');
        return;
      }
    }

    setLoading(true);
    // Assemble servant specific details
    const selectedSkillsList = Object.entries(skills).filter(([_, v]) => v).map(([k]) => k).join(',');
    const selectedBlocksList = selectedBlocks.join(',');
    const selectedTimesList = Object.entries(timeSlots)
      .filter(([_, v]) => v)
      .map(([k]) => k === 'morning' ? 'Morning (8am-12pm)' : k === 'afternoon' ? 'Afternoon (1pm-5pm)' : 'Evening (6pm-9pm)')
      .join(',');

    const payload = {
      phone,
      name,
      password,
      role,
      otp: otpCode,
      nid,
      nidFront,
      nidBack,
      type,
      skills: selectedSkillsList,
      rate: parseInt(rate),
      locations: selectedBlocksList,
      timeSlots: selectedTimesList
    };

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please check server status.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: role === 'servant' && !isLogin ? '680px' : '440px', padding: '2.5rem', marginTop: '2rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isLogin ? 'Login to access your BuaBondhu account' : 'Join as a client or verified domestic helper'}
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              padding: '0.8rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: '6px', 
              color: '#f87171', 
              fontSize: '0.85rem', 
              marginBottom: '1.5rem', 
              textAlign: 'center' 
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Role Select tab (only during registration or general login) */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '4px', background: 'rgba(17, 24, 39, 0.6)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => { setRole('customer'); setRegStep(1); }}
            style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', background: role === 'customer' ? 'var(--primary)' : 'transparent', color: 'white', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
          >
            Customer
          </button>
          <button 
            onClick={() => { setRole('servant'); setRegStep(1); }}
            style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', background: role === 'servant' ? 'var(--primary)' : 'transparent', color: 'white', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
          >
            Bua / Servant
          </button>
          {isLogin && (
            <button 
              onClick={() => { setRole('admin'); }}
              style={{ padding: '0.6rem 1rem', border: 'none', borderRadius: '6px', background: role === 'admin' ? 'var(--primary)' : 'transparent', color: 'white', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
            >
              Admin
            </button>
          )}
        </div>

        {isLogin ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Smartphone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="tel" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="e.g. 017XXXXXXXX" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="Enter secret password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* REGISTRATION WIZARD */
          <div>
            {role === 'customer' ? (
              /* Customer Register Simple Form */
              <div>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '2.5rem' }} 
                      placeholder="Your name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Smartphone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="tel" 
                      className="input-field" 
                      style={{ paddingLeft: '2.5rem' }} 
                      placeholder="01XXXXXXXXX" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="password" 
                      className="input-field" 
                      style={{ paddingLeft: '2.5rem' }} 
                      placeholder="Choose a password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleRegister} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </div>
            ) : (
              /* Servant Register Multi-Step Form */
              <div>
                {/* Steps Header indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  <span style={{ color: regStep >= 1 ? 'var(--primary)' : '' }}>1. Account Info</span>
                  <span style={{ color: regStep >= 2 ? 'var(--primary)' : '' }}>2. Preferences</span>
                  <span style={{ color: regStep >= 3 ? 'var(--primary)' : '' }}>3. Verified Identity</span>
                </div>

                {/* Step 1: Personal Details */}
                {regStep === 1 && (
                  <div className="animate-fade-in">
                    <div className="input-group">
                      <label className="input-label">Servant Full Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Rokeya Begum" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone Number</label>
                      <input 
                        type="tel" 
                        className="input-field" 
                        placeholder="e.g. 019XXXXXXXX" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Secure Password</label>
                      <input 
                        type="password" 
                        className="input-field" 
                        placeholder="Choose password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button onClick={handleRegister} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                      Continue to Work Profile
                    </button>
                  </div>
                )}

                {/* Step 2: Work Preferences */}
                {regStep === 2 && (
                  <div className="animate-fade-in">
                    <div className="grid-2">
                      <div className="input-group">
                        <label className="input-label">Working Type</label>
                        <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                          <option value="part_time">Part-time (পার্ট টাইম)</option>
                          <option value="full_time">Full-time (ফুল টাইম)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Preferable Monthly Rate (৳)</label>
                        <input 
                          type="number" 
                          className="input-field" 
                          value={rate}
                          onChange={(e) => setRate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Skill selector */}
                    <div className="input-group">
                      <label className="input-label">Type of Work Offered</label>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        {['cooking', 'cleaning', 'washing'].map((skill) => (
                          <button
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

                    {/* Time slot selector */}
                    <div className="input-group">
                      <label className="input-label">Availability Time Slots</label>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        {['morning', 'afternoon', 'evening'].map((slot) => (
                          <button
                            key={slot}
                            onClick={() => toggleTimeSlot(slot)}
                            style={{
                              flex: 1,
                              padding: '0.6rem 0.5rem',
                              background: timeSlots[slot] ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${timeSlots[slot] ? 'var(--primary)' : 'var(--border-color)'}`,
                              borderRadius: '6px',
                              color: timeSlots[slot] ? 'white' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontWeight: '500',
                              fontSize: '0.85rem',
                              textTransform: 'capitalize'
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Block multi-selector (Google Map representation list) */}
                    <div className="input-group">
                      <label className="input-label">Bashundhara Block Availability (Select Multiple)</label>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button onClick={() => setRegStep(1)} className="btn-secondary" style={{ flex: 1 }}>
                        Back
                      </button>
                      <button onClick={handleRegister} className="btn-primary" style={{ flex: 2 }}>
                        Continue to Verification
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Identity Verification */}
                {regStep === 3 && (
                  <div className="animate-fade-in">
                    <div className="input-group">
                      <label className="input-label">NID Card Number (For Safety Check)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="10-digit NID Number" 
                        maxLength={10}
                        value={nid}
                        onChange={(e) => setNid(e.target.value)}
                      />
                    </div>

                    <div className="grid-2" style={{ marginBottom: '1.2rem' }}>
                      <div>
                        <label className="input-label">NID Front Page Image</label>
                        <div style={{ position: 'relative', border: '2px dashed var(--border-color)', borderRadius: '8px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleNidUpload(e, 'front')}
                            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                          />
                          {nidFront ? (
                            <img src={nidFront} alt="NID Front" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '6px', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Front Side</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="input-label">NID Back Page Image</label>
                        <div style={{ position: 'relative', border: '2px dashed var(--border-color)', borderRadius: '8px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleNidUpload(e, 'back')}
                            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                          />
                          {nidBack ? (
                            <img src={nidBack} alt="NID Back" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '6px', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Back Side</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phone verification OTP segment */}
                    <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', marginBottom: '1.2rem' }}>
                      <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Shield size={14} color="var(--primary)" /> Mobile OTP Verification
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          style={{ flex: 1, textAlign: 'center', fontSize: '1rem' }} 
                          placeholder="Enter OTP Code" 
                          maxLength={4}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        {!otpSent ? (
                          <button onClick={handleSendOtp} className="btn-secondary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} disabled={loading}>
                            Send OTP
                          </button>
                        ) : (
                          <span style={{ alignSelf: 'center', fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600' }}>
                            ✓ Sent (Code: 1234)
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button onClick={() => setRegStep(2)} className="btn-secondary" style={{ flex: 1 }}>
                        Back
                      </button>
                      <button onClick={handleRegister} className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                        {loading ? 'Submitting Details...' : 'Complete Registry'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
