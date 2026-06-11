import React, { useState } from 'react';
import { CreditCard, ShieldCheck, X, ArrowRight, Loader } from 'lucide-react';

export default function PaymentModal({ invoice, onClose, onPaymentSuccess }) {
  const [method, setMethod] = useState(''); // 'bKash', 'Nagad', 'Card'
  const [step, setStep] = useState(1); // 1: Select/Number, 2: OTP, 3: PIN, 4: Loading/Success
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleStartMethod = (selectedMethod) => {
    setMethod(selectedMethod);
    setStep(selectedMethod === 'Card' ? 2 : 1);
    setError('');
  };

  const handleNextStep = () => {
    if (method === 'Card') {
      if (step === 2) {
        if (!cardNumber || !expiry || !cvv) {
          setError('Please fill in all card fields');
          return;
        }
        setStep(3); // OTP screen for Card
        setError('');
      } else if (step === 3) {
        if (otp !== '123456') {
          setError('Invalid OTP (Simulated: 123456)');
          return;
        }
        submitPayment();
      }
    } else {
      // bKash / Nagad flow
      if (step === 1) {
        if (!phoneNumber || phoneNumber.length < 11) {
          setError('Please enter a valid phone number');
          return;
        }
        setStep(2); // OTP Screen
        setError('');
      } else if (step === 2) {
        if (otp !== '123456') {
          setError('Invalid OTP (Simulated: 123456)');
          return;
        }
        setStep(3); // PIN Screen
        setError('');
      } else if (step === 3) {
        if (!pin || pin.length < 4) {
          setError('Please enter a valid security PIN');
          return;
        }
        submitPayment();
      }
    }
  };

  const submitPayment = async () => {
    setLoading(true);
    setError('');

    // Generate simulated TXID
    const prefix = method === 'bKash' ? 'BKSH' : method === 'Nagad' ? 'NGD' : 'CRD';
    const txid = prefix + Math.floor(10000000 + Math.random() * 90000000);

    try {
      const response = await fetch(`http://localhost:5000/api/payments/pay/${invoice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentMethod: method,
          txid: txid
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setStep(4); // Success screen
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Payment failed');
        setStep(method === 'Card' ? 2 : 1);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Connection failed. Please retry.');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
    >
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '90%',
          maxWidth: '440px',
          padding: '2rem',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'linear-gradient(135deg, #111827 0%, #0b0f19 100%)'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '0.25rem' }}>
            Checkout Gateway
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Pay Invoice for Bua Service: <b>৳{invoice.amount}</b>
          </p>
        </div>

        {error && (
          <div 
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Step 0: Selection */}
        {!method && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
              Select payment method:
            </p>
            
            {/* bKash option */}
            <button
              onClick={() => handleStartMethod('bKash')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(209, 32, 83, 0.08)',
                border: '1px solid rgba(209, 32, 83, 0.25)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(209, 32, 83, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(209, 32, 83, 0.08)'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ background: 'var(--accent-bkash)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800' }}>bKash</span>
                bKash Wallet
              </span>
              <ArrowRight size={18} />
            </button>

            {/* Nagad option */}
            <button
              onClick={() => handleStartMethod('Nagad')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(241, 90, 34, 0.08)',
                border: '1px solid rgba(241, 90, 34, 0.25)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(241, 90, 34, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(241, 90, 34, 0.08)'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ background: 'var(--accent-nagad)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800' }}>নগদ</span>
                Nagad Wallet
              </span>
              <ArrowRight size={18} />
            </button>

            {/* Credit Card option */}
            <button
              onClick={() => handleStartMethod('Card')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <CreditCard size={20} color="var(--primary)" />
                Debit / Credit Card
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* bKash / Nagad Form */}
        {method && method !== 'Card' && (
          <div>
            {/* Header info */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'white',
                padding: '0.5rem',
                background: method === 'bKash' ? 'var(--accent-bkash)' : 'var(--accent-nagad)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '700',
                marginBottom: '1.5rem'
              }}
            >
              {method === 'bKash' ? 'bKash Checkout' : 'Nagad Checkout'}
            </div>

            {/* Step 1: Wallet Number */}
            {step === 1 && (
              <div>
                <div className="input-group">
                  <label className="input-label">Enter Mobile Account Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. 017XXXXXXXX"
                    maxLength={11}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleNextStep} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Send Verification OTP
                </button>
              </div>
            )}

            {/* Step 2: OTP Entry */}
            {step === 2 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    A verification code has been sent to <b>{phoneNumber}</b>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    (Sandbox Test Code: <b>123456</b>)
                  </p>
                </div>
                <div className="input-group">
                  <label className="input-label">Verification Code (OTP)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                  />
                </div>
                <button 
                  onClick={handleNextStep} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Verify Account
                </button>
              </div>
            )}

            {/* Step 3: PIN Entry */}
            {step === 3 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Enter secret PIN to confirm payment of <b>৳{invoice.amount}</b>
                  </p>
                </div>
                <div className="input-group">
                  <label className="input-label">Account PIN</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••"
                    maxLength={5}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                  />
                </div>
                
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Loader className="animate-spin" size={24} color="var(--primary)" />
                  </div>
                ) : (
                  <button 
                    onClick={handleNextStep} 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem', background: method === 'bKash' ? 'var(--accent-bkash)' : 'var(--accent-nagad)' }}
                  >
                    Confirm Payment
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card Form */}
        {method === 'Card' && (
          <div>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'white',
                padding: '0.5rem',
                background: 'var(--primary)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '700',
                marginBottom: '1.5rem'
              }}
            >
              <CreditCard size={18} /> Card Gateway
            </div>

            {/* Step 2: Details */}
            {step === 2 && (
              <div>
                <div className="input-group">
                  <label className="input-label">Cardholder Number</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Expiration Date</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">CVV / CVC</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="123"
                      maxLength={3}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleNextStep} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Pay ৳{invoice.amount}
                </button>
              </div>
            )}

            {/* Step 3: Card OTP */}
            {step === 3 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Enter 3D-Secure bank OTP code sent to your phone.
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    (Sandbox Test Code: <b>123456</b>)
                  </p>
                </div>
                <div className="input-group">
                  <label className="input-label">Verification OTP</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="------"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                  />
                </div>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Loader className="animate-spin" size={24} color="var(--primary)" />
                  </div>
                ) : (
                  <button 
                    onClick={handleNextStep} 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    Authenticate & Pay
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Loading & Success Page */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--accent-teal)',
              color: 'var(--accent-teal)',
              marginBottom: '1.5rem',
              animation: 'pulseGlow 1.5s infinite'
            }}>
              <ShieldCheck size={36} />
            </div>
            <h4 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Payment Successful!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Transaction has been verified and settled.
            </p>
          </div>
        )}

        {/* Back Button */}
        {method && step < 4 && (
          <button
            onClick={() => {
              setMethod('');
              setStep(1);
              setError('');
            }}
            style={{
              width: '100%',
              marginTop: '1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Choose a different payment method
          </button>
        )}
      </div>
    </div>
  );
}
