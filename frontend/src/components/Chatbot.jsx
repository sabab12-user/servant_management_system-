import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, Send, X, Volume2, VolumeX, MicOff } from 'lucide-react';

const AI_DATABASE = {
  bangla: [
    {
      keywords: ['কমিশন', 'ফি', 'পারসেন্টেজ', 'কত কাটে', 'কমিসন', 'commission'],
      response: 'বুয়াবন্ধু প্ল্যাটফর্মে প্রথম মাসের বেতনের ৩০% কমিশন নেওয়া হয়। পরবর্তী মাস থেকে প্ল্যাটফর্ম ফি ১৫% চার্জ করা হয়।'
    },
    {
      keywords: ['ভাড়া', 'দাম', 'কত টাকা', 'বেতন', 'টাকা', 'খরচ', 'pricing', 'price', 'rate'],
      response: 'আমাদের রেট হিসাব করা হয় প্রতি কাজের ভিত্তিতে। ব্যাচেলর ফ্ল্যাটের জন্য প্রতি কাজে ১,০০০ টাকা এবং ফ্যামিলি ফ্ল্যাটের জন্য প্রতি কাজে ১,৩০০ টাকা মাসিক বেতন ধার্য করা হয়।'
    },
    {
      keywords: ['নিরাপত্তা', 'এনআইডি', 'চুরি', 'ঝামেলা', 'নিরাপদ', 'safety', 'secure', 'nid'],
      response: 'নিরাপত্তার স্বার্থে আমরা সকল বুয়াদের ১০ ডিজিটের NID এবং ছবি সংগ্রহ করে ভেরিফাই করি। কোনো অনাকাঙ্ক্ষিত ঘটনা ঘটলে প্ল্যাটফর্ম আইনি সহায়তার জন্য NID ইনফরমেশন পুলিশকে প্রদান করবে।'
    },
    {
      keywords: ['বুক', 'কিভাবে বুক', 'বুয়া পাব', 'পদ্ধতি', 'booking'],
      response: 'পদ্ধতিটি খুবই সহজ! ড্যাশবোর্ডের মানচিত্রে আপনার ব্লক (যেমন ব্লক I) সিলেক্ট করুন, পছন্দের বুয়ার ডিটেইলস দেখে বুকিং কনফিগার করুন এবং আপনার ডিজিটাল এগ্রিমেন্ট সাইন করুন।'
    },
    {
      keywords: ['পেমেন্ট', 'বিকাশ', 'নগদ', 'কার্ড', 'বিল', 'payment', 'bkash', 'nagad'],
      response: 'মাস শেষে সরাসরি আমাদের প্ল্যাটফর্মে বিল পে করতে হবে (বিকাশ, নগদ, অথবা কার্ড দিয়ে)। বুয়াদের হাতে সরাসরি নগদ টাকা দেওয়া কঠোরভাবে নিষিদ্ধ।'
    },
    {
      keywords: ['হ্যালো', 'হাই', 'কেমন আছেন', 'কেমন আছ', 'hi', 'hello'],
      response: 'হ্যালো! আমি বুয়াবন্ধু এআই অ্যাসিস্ট্যান্ট। আমি কীভাবে আপনাকে সাহায্য করতে পারি? আপনি বাংলায় বা ইংরেজিতে বলতে পারেন।'
    }
  ],
  english: [
    {
      keywords: ['commission', 'fee', 'charge', 'platform fee', 'percentage'],
      response: 'Our commission is 30% for the first month as an onboarding agency fee. From the second month onwards, it drops to a standard 15% platform maintenance fee.'
    },
    {
      keywords: ['pricing', 'rate', 'price', 'salary', 'charge', 'cost', 'how much'],
      response: 'Rates are computed per task: For Bachelor Flats, it is ৳1,000 per task/month. For Family Flats, it is ৳1,300 per task/month (Cooking, Cleaning, Washing).'
    },
    {
      keywords: ['safety', 'nid', 'security', 'verification', 'theft', 'background'],
      response: 'Safety is our top priority! We collect verified NID cards and verify mobile numbers via OTP. NID details are kept hidden publicly but used for legal actions if needed.'
    },
    {
      keywords: ['book', 'booking', 'how to book', 'hiring'],
      response: 'Just select your Bashundhara block on the map, filter by work type, click on a servant, configure the tasks, and sign the digital agreement terms.'
    },
    {
      keywords: ['payment', 'bkash', 'nagad', 'card', 'bill', 'pay'],
      response: 'Customers must pay monthly bills through our digital system using MFS (bKash/Nagad/Rocket) or Cards. Direct cash payment to maids is prohibited.'
    },
    {
      keywords: ['hi', 'hello', 'hey', 'greetings', 'help'],
      response: 'Hello! I am your BuaBondhu AI assistant. How can I help you today? You can type or click the microphone to speak!'
    }
  ]
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'হ্যালো! আমি বুয়াবন্ধু এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে বুকিং, রেট বা নিরাপত্তা বিষয়ে সাহায্য করতে পারি।\n\nHello! I am your BuaBondhu AI assistant. How can I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('bn'); // 'bn' (Bangla) or 'en' (English)
  const [isListening, setIsListening] = useState(false);
  const [speakOutput, setSpeakOutput] = useState(true);
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Setup Web Speech API for Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome, Edge or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Set correct language code
      recognitionRef.current.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      recognitionRef.current.start();
    }
  };

  // Text to Speech
  const speakResponse = (text, languageCode) => {
    if (!speakOutput) return;
    window.speechSynthesis.cancel(); // cancel any active speaking

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode === 'bn' ? 'bn-BD' : 'en-US';
    
    // Choose appropriate rate
    utterance.rate = languageCode === 'bn' ? 0.95 : 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (textToSend = input) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsListening(false);

    // AI thinking state simulation
    setTimeout(() => {
      processAiResponse(textToSend.toLowerCase());
    }, 700);
  };

  const processAiResponse = (query) => {
    let responseText = '';
    let responseLang = lang;

    // Direct language check
    const matchesBanglaChar = /[\u0980-\u09ff]/.test(query);
    const databaseKey = matchesBanglaChar ? 'bangla' : 'english';
    responseLang = matchesBanglaChar ? 'bn' : 'en';

    // Search matches
    const rules = AI_DATABASE[databaseKey];
    const match = rules.find(rule => 
      rule.keywords.some(keyword => query.includes(keyword))
    );

    if (match) {
      responseText = match.response;
    } else {
      responseText = databaseKey === 'bangla' 
        ? 'দুঃখিত, আমি আপনার প্রশ্নটি ঠিক বুঝতে পারিনি। আপনি কি আমাদের কমিশন, সার্ভিস চার্জ, রেট বা নিরাপত্তা নিয়ে জানতে চান?'
        : "I'm sorry, I couldn't quite understand that. Would you like to know about our commission fees, pricing rates, or NID safety?";
    }

    // Add AI message
    setMessages(prev => [...prev, {
      sender: 'ai',
      text: responseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    // Speak out
    speakResponse(responseText, responseLang);
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 3000 }}>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: 'pulseGlow 2s infinite'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            width: '380px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #111827 0%, #0b0f19 100%)'
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)' }} />
              <div>
                <h4 style={{ color: 'white', fontSize: '0.95rem' }}>BuaBondhu AI Agent</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bilingual Support Active</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Language Switch */}
              <button
                onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {lang === 'bn' ? 'বাং' : 'EN'}
              </button>

              {/* Speak output toggle */}
              <button
                onClick={() => setSpeakOutput(!speakOutput)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title={speakOutput ? 'Mute Speech' : 'Unmute Speech'}
              >
                {speakOutput ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(0,0,0,0.1)'
            }}
          >
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={index}
                  style={{
                    alignSelf: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    animation: 'fadeIn 0.3s ease-out forwards'
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: isAi ? '0 14px 14px 14px' : '14px 14px 0 14px',
                      backgroundColor: isAi ? 'rgba(30, 41, 59, 0.65)' : 'var(--primary)',
                      border: isAi ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      color: 'white',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    {msg.text}
                  </div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      textAlign: isAi ? 'left' : 'right',
                      marginTop: '0.25rem',
                      padding: '0 0.2rem'
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Panel */}
          <div
            style={{
              padding: '0.8rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(9, 13, 22, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {/* Mic Button */}
            <button
              onClick={handleMicToggle}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isListening ? '#ef4444' : 'var(--border-color)'}`,
                color: isListening ? '#ef4444' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              title="Speak in selected language"
            >
              {isListening ? (
                <>
                  <Mic size={18} className="animate-pulse" />
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-18px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.6rem',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Listening...
                  </span>
                </>
              ) : (
                <Mic size={18} />
              )}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'bn' ? 'বাংলায় কিছু জিজ্ঞাসা করুন...' : 'Type query in English...'}
              style={{
                flex: 1,
                padding: '0.6rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(17, 24, 39, 0.6)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
