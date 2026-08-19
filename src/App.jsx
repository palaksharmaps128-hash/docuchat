import { useState, useRef, useEffect } from 'react'
import './App.css'

const API_BASE = "https://docuchat-1-ng6q.onrender.com"

const RobotIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <circle cx="9" cy="14" r="1.3" fill="white" stroke="none" />
    <circle cx="15" cy="14" r="1.3" fill="white" stroke="none" />
    <path d="M12 8 V4" />
    <circle cx="12" cy="3" r="1.2" fill="white" stroke="none" />
    <path d="M4 13 H2 M22 13 H20" />
  </svg>
)

const PlusChatIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 4v-4H6a2 2 0 0 1-2-2V6Z" />
    <path d="M12 7v6M9 10h6" />
  </svg>
)

const UploadDocIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <circle cx="9.5" cy="8" r="1.3" fill="white" stroke="none" />
    <circle cx="14.5" cy="8" r="1.3" fill="white" stroke="none" />
    <path d="M9 15l3-3 3 3M12 12v6" />
  </svg>
)

const BrainIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="16" height="12" rx="4" />
    <circle cx="9" cy="12" r="1.3" fill="white" stroke="none" />
    <circle cx="15" cy="12" r="1.3" fill="white" stroke="none" />
    <path d="M12 6V4M9 18v1.5M15 18v1.5" />
  </svg>
)

const SparkleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="7" width="16" height="10" rx="3" />
    <circle cx="9.5" cy="12" r="1.3" fill="white" stroke="none" />
    <circle cx="14.5" cy="12" r="1.3" fill="white" stroke="none" />
    <path d="M12 7V4.5M8 4.5h8" />
  </svg>
)

const UploadTrayIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v11" />
    <path d="M8 7l4-4 4 4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
)

const ChatTabIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16v10H9l-4 4V5Z" />
    <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

const FolderTabIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z" />
  </svg>
)

const ClockTabIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </svg>
)

const UserTabIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
  </svg>
)

const PlusTabIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const NetworkLogo = ({ size = 90 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="netGrad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <line x1="50" y1="50" x2="30" y2="30" stroke="url(#netGrad)" strokeWidth="2.5" />
    <line x1="50" y1="50" x2="70" y2="30" stroke="url(#netGrad)" strokeWidth="2.5" />
    <line x1="50" y1="50" x2="35" y2="70" stroke="url(#netGrad)" strokeWidth="2.5" />
    <line x1="50" y1="50" x2="65" y2="70" stroke="url(#netGrad)" strokeWidth="2.5" />
    <line x1="70" y1="30" x2="80" y2="35" stroke="url(#netGrad)" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="10" fill="#7c3aed" />
    <circle cx="30" cy="30" r="6" fill="#c4b5fd" />
    <circle cx="70" cy="30" r="6" fill="#22d3ee" />
    <circle cx="80" cy="35" r="4" fill="#4f46e5" />
    <circle cx="35" cy="70" r="5" fill="#818cf8" />
    <circle cx="65" cy="70" r="5" fill="#4f46e5" />
  </svg>
)

const SplashUploadIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
    <path d="M14 2v5h5" />
    <path d="M9 12h6M9 16h4" />
  </svg>
)

const SplashSparkleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
  </svg>
)

const SplashChatIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16v10H9l-4 4V5Z" />
    <circle cx="9" cy="10" r="1" fill="white" stroke="none" />
    <circle cx="12" cy="10" r="1" fill="white" stroke="none" />
    <circle cx="15" cy="10" r="1" fill="white" stroke="none" />
  </svg>
)

function App() {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [simplified, setSimplified] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [questionText, setQuestionText] = useState('')
  const [loading, setLoading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)

  const [recording, setRecording] = useState(false)
  const [liveCaption, setLiveCaption] = useState('')
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  const [recentDocs, setRecentDocs] = useState([])
  const [activeDocId, setActiveDocId] = useState(null)
  const [docImage, setDocImage] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [generalChat, setGeneralChat] = useState(false)
  const isStandalonePWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  const [showSplash, setShowSplash] = useState(!isStandalonePWA)
  const [splashFading, setSplashFading] = useState(false)

  useEffect(() => {
    if (isStandalonePWA) return
    const fadeTimer = setTimeout(() => setSplashFading(true), 2200)
    const hideTimer = setTimeout(() => setShowSplash(false), 2600)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('docuchat_recent')
    if (saved) {
      try { setRecentDocs(JSON.parse(saved)) } catch (e) { /* ignore */ }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const persistRecent = (list) => {
    setRecentDocs(list)
    localStorage.setItem('docuchat_recent', JSON.stringify(list))
  }

  const timeNow = () => {
    const d = new Date()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderFormattedText = (text) => {
    if (!text) return null

    // LLM kabhi "*" se bullets banata hai, kabhi "-" se — dono formats
    // ko handle karte hain taaki formatting hamesha sundar list mein
    // convert ho, chahe LLM ka exact output style kuch bhi ho.
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const bulletPattern = /^[*-]\s+(.*)/

    const isBulletLine = (line) => bulletPattern.test(line)
    const hasBullets = lines.some(isBulletLine)

    if (!hasBullets) {
      return <p className="msg-text">{text}</p>
    }

    const intro = []
    const items = []
    let seenBullet = false

    for (const line of lines) {
      const match = line.match(bulletPattern)
      if (match) {
        seenBullet = true
        items.push(match[1].trim())
      } else if (!seenBullet) {
        intro.push(line)
      } else {
        if (items.length > 0) {
          items[items.length - 1] += ' ' + line
        }
      }
    }

    return (
      <>
        {intro.length > 0 && <p className="msg-intro">{intro.join(' ')}</p>}
        <ul className="msg-bullet-list">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </>
    )
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
        setDocImage(reader.result)
      }
      reader.readAsDataURL(file)
      setSimplified(null)
      setChatHistory([])
      setActiveDocId(null)
      setGeneralChat(false)
    }
  }

  const handleNewDocument = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setSimplified(null)
    setChatHistory([])
    setQuestionText('')
    setActiveDocId(null)
    setDocImage(null)
    setShowHistory(false)
    setGeneralChat(true)
  }

  const handleSimplify = async () => {
    if (!selectedFile) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      const res = await fetch(`${API_BASE}/api/simplify`, { method: "POST", body: formData })
      const data = await res.json()
      setSimplified(data.simplified)

      const docId = Date.now().toString()
      const title = selectedFile.name.replace(/\.[^/.]+$/, "").slice(0, 26) || "Untitled Document"
      const sizeKb = Math.round(selectedFile.size / 1024)
      const entry = {
        id: docId, title,
        date: new Date().toLocaleDateString([], { day: '2-digit', month: 'short' }),
        size: sizeKb, simplified: data.simplified, chatHistory: [], image: docImage
      }
      const updated = [entry, ...recentDocs].slice(0, 12)
      persistRecent(updated)
      setActiveDocId(docId)
    } catch (err) {
      setSimplified("Error: could not connect to the backend. Make sure server.py is running.")
    }
    setLoading(false)
  }

  const updateActiveDocHistory = (newHistory) => {
    if (!activeDocId) return
    const updated = recentDocs.map(d => d.id === activeDocId ? { ...d, chatHistory: newHistory } : d)
    persistRecent(updated)
  }

  const sendQuestionToBackend = async (question) => {
    if (!question.trim()) return
    const newHistory = [...chatHistory, { role: 'user', text: question, time: timeNow() }]
    setChatHistory(newHistory)
    setAsking(true)
    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      })
      const data = await res.json()
      const finalHistory = [...newHistory, { role: 'assistant', text: data.answer, time: timeNow() }]
      setChatHistory(finalHistory)
      updateActiveDocHistory(finalHistory)
    } catch (err) {
      const finalHistory = [...newHistory, { role: 'assistant', text: 'Error: could not reach the backend.', time: timeNow() }]
      setChatHistory(finalHistory)
      updateActiveDocHistory(finalHistory)
    }
    setAsking(false)
  }

  const handleSendQuestion = () => {
    if (!questionText.trim()) return
    const q = questionText
    setQuestionText('')
    sendQuestionToBackend(q)
  }

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSendQuestion() }

  const handleListen = (text) => {
    if (!('speechSynthesis' in window)) {
      alert("Voice output isn't supported in this browser. Try Chrome.")
      return
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const cleanText = text.replace(/\*/g, '').replace(/\s{2,}/g, ' ').trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1
    const voices = window.speechSynthesis.getVoices()
    const indianVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang && v.lang.startsWith('en-IN'))
    if (indianVoice) utterance.voice = indianVoice
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const openRecentDoc = (doc) => {
    setSimplified(doc.simplified)
    setChatHistory(doc.chatHistory || [])
    setActiveDocId(doc.id)
    setPreviewUrl(null)
    setSelectedFile(null)
    setDocImage(doc.image || null)
    setShowHistory(false)
    setGeneralChat(false)
  }

  const deleteRecentDoc = (e, docId) => {
    e.stopPropagation()
    const updated = recentDocs.filter(d => d.id !== docId)
    persistRecent(updated)
    if (activeDocId === docId) handleNewDocument()
  }

  const focusInput = () => { inputRef.current && inputRef.current.focus() }

  const handleSimplifyClick = () => {
    if (selectedFile && !loading) {
      handleSimplify()
    } else if (simplified) {
      sendQuestionToBackend("Can you explain this document in a bit more detail, still in simple language?")
    } else if (!loading) {
      document.getElementById('fileInput')?.click()
    }
  }

  const handleAskClick = () => {
    if (simplified) {
      sendQuestionToBackend("Give me a short one-line summary of the most important point in this document.")
    } else {
      document.getElementById('fileInput')?.click()
    }
  }

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert("Voice input isn't supported in this browser. Try Chrome."); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript
      setLiveCaption(transcript)
    }
    recognition.onerror = (event) => {
      setRecording(false)
      alert("Voice input error: " + event.error)
    }
    recognition.start()
    recognitionRef.current = recognition
    setLiveCaption('')
    setRecording(true)
  }

  const cancelRecording = () => {
    if (recognitionRef.current) { recognitionRef.current.onresult = null; recognitionRef.current.stop() }
    setRecording(false)
    setLiveCaption('')
  }

  const confirmRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop()
    setRecording(false)
    if (liveCaption.trim()) sendQuestionToBackend(liveCaption.trim())
    setLiveCaption('')
  }

  return (
    <div className="app-shell">
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>

      {showSplash && (
        <div className={`splash-screen ${splashFading ? 'splash-fade-out' : ''}`}>
          <div className="splash-stars">
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div className="splash-logo-glow"></div>
          <div className="splash-logo-wrap"><NetworkLogo size={140} /></div>
          <div className="splash-title">
            Insight<span className="splash-title-accent">Bot</span>
          </div>
          <div className="splash-tagline">
            Read less. <span className="splash-tagline-accent">Understand more.</span>
          </div>
          <div className="splash-divider"></div>
          <div className="splash-subtitle">
            Your documents, simplified.<br />Instant insights, smarter decisions.
          </div>
          <div className="splash-features">
            <div className="splash-feature">
              <div className="splash-feature-icon splash-feature-icon-1"><SplashUploadIcon /></div>
              <span>Upload<br />Any Document</span>
            </div>
            <div className="splash-feature">
              <div className="splash-feature-icon splash-feature-icon-2"><SplashSparkleIcon /></div>
              <span>Get AI<br />Insights</span>
            </div>
            <div className="splash-feature">
              <div className="splash-feature-icon splash-feature-icon-3"><SplashChatIcon /></div>
              <span>Ask &amp;<br />Understand</span>
            </div>
          </div>
          <svg className="splash-wave" viewBox="0 0 400 120" preserveAspectRatio="none">
            <path d="M0 70 Q 60 20, 120 55 T 240 50 T 400 30 V120 H0 Z" fill="url(#waveGrad)" opacity="0.35" />
            <path d="M0 85 Q 70 40, 140 70 T 260 65 T 400 45" stroke="url(#waveGrad)" strokeWidth="1.2" fill="none" strokeDasharray="1 6" opacity="0.6" />
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="400" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      <div className="app-frame">
        {/* Top header */}
        <header className="top-header">
          <button className="icon-btn" onClick={() => setShowHistory(true)} title="Chats">☰</button>
          <div className="header-titles">
            <div className="header-title">InsightBot</div>
            <div className="header-sub">Turn Documents Into Insights</div>
          </div>
          <div className="header-avatar">P</div>
        </header>

        {/* Quick actions row */}
        <div className="quick-actions-row">
          <button className="qa-card" onClick={handleNewDocument}>
            <div className="qa-card-top">
              <span className="qa-icon qa-icon-1"><PlusChatIcon size={17} /></span>
              <span className="qa-arrow">›</span>
            </div>
            <span className="qa-title">New Chat</span>
            <span className="qa-sub">Start a new conversation</span>
          </button>
          <button className="qa-card" onClick={() => document.getElementById('fileInput')?.click()}>
            <div className="qa-card-top">
              <span className="qa-icon qa-icon-2"><UploadDocIcon size={17} /></span>
              <span className="qa-arrow">›</span>
            </div>
            <span className="qa-title">Upload</span>
            <span className="qa-sub">Add a document</span>
          </button>
          <button className="qa-card" onClick={handleSimplifyClick}>
            <div className="qa-card-top">
              <span className="qa-icon qa-icon-3"><BrainIcon size={17} /></span>
              <span className="qa-arrow">›</span>
            </div>
            <span className="qa-title">Simplify</span>
            <span className="qa-sub">{simplified ? 'Get a deeper explanation' : 'Explain complex docs'}</span>
          </button>
          <button className="qa-card" onClick={handleAskClick}>
            <div className="qa-card-top">
              <span className="qa-icon qa-icon-4"><SparkleIcon size={17} /></span>
              <span className="qa-arrow">›</span>
            </div>
            <span className="qa-title">Summarize</span>
            <span className="qa-sub">{simplified ? 'Get a one-line summary' : 'Get key points instantly'}</span>
          </button>
        </div>

        {/* Slide-in history drawer */}
        {showHistory && (
          <div className="drawer-overlay" onClick={() => setShowHistory(false)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <span>Chats</span>
                <button className="icon-btn" onClick={() => setShowHistory(false)}>✕</button>
              </div>
              <div className="recent-list">
                {recentDocs.length === 0 && (
                  <div className="recent-empty">Your document chats will appear here</div>
                )}
                {recentDocs.map((doc) => (
                  <div key={doc.id} className={`recent-item ${activeDocId === doc.id ? 'active' : ''}`} onClick={() => openRecentDoc(doc)}>
                    <span className="recent-item-icon">💬</span>
                    <span className="recent-item-text">
                      <span className="recent-item-title">{doc.title}</span>
                      <span className="recent-item-date">{doc.date}</span>
                    </span>
                    <button className="delete-item-btn" title="Delete" onClick={(e) => deleteRecentDoc(e, doc.id)}>🗑</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="today-divider"><span>Today</span></div>

        {/* Messages */}
        <div className="messages-area">
          {!simplified && (
            <div className="welcome-hero welcome-hero-slim">
              <div className="mascot-wrap">
                <span className="mascot-sparkle sparkle-left">✨</span>
                <div className="mascot-circle"><RobotIcon size={30} /></div>
                <span className="mascot-sparkle sparkle-right">✨</span>
              </div>
              <div className="welcome-hero-title welcome-hero-title-slim">Let's get started 👋</div>
              <div className="welcome-hero-sub">
                Upload a document below to begin.
              </div>
            </div>
          )}

          {!simplified && (
            <div className="upload-standalone">
              <div className="upload-box">
                <input type="file" accept="image/*" onChange={handleFileChange} id="fileInput" />
                <label htmlFor="fileInput" className="upload-label">
                  <div className="upload-icon"><UploadTrayIcon size={30} /></div>
                  <div className="upload-text">Upload a document</div>
                  <div className="upload-hint">JPG, JPEG or PNG</div>
                  <div className="upload-choose-btn"><UploadTrayIcon size={16} /> Choose File</div>
                  <div className="upload-drag-hint">or drag and drop here</div>
                </label>
              </div>
                {previewUrl && (
                  <div className="preview-section">
                    <img src={previewUrl} alt="Uploaded document" className="preview-image" />
                    <button className="simplify-btn" onClick={handleSimplify} disabled={loading}>
                      {loading ? 'Reading and simplifying...' : 'Simplify Document'}
                    </button>
                  </div>
                )}
              <div className="security-note">🔒 Your documents are secure and never shared with anyone.</div>
            </div>
          )}

          {simplified && docImage && (
            <div className="msg-row user">
              <div className="msg-bubble user image-msg-bubble">
                <img src={docImage} alt="Uploaded document" className="chat-thumb-image" />
                <div className="msg-time">{timeNow()}</div>
              </div>
              <div className="avatar user-avatar">P</div>
            </div>
          )}

          {simplified && (
            <div className="msg-row assistant">
              <div className="avatar assistant-avatar"><RobotIcon size={16} /></div>
              <div className="msg-bubble assistant">
                <div className="msg-label">Simplified Version</div>
                {renderFormattedText(simplified)}
                <div className="msg-actions">
                  <button className="icon-action-btn" title="Copy" onClick={() => handleCopy(simplified, 'summary')}>
                    {copiedIdx === 'summary' ? '✓' : '⧉'}
                  </button>
                  <button className="icon-action-btn" title={speaking ? "Stop" : "Listen"} onClick={() => handleListen(simplified)}>
                    {speaking ? '⏹' : '🔊'}
                  </button>
                  <span className="msg-time">{timeNow()}</span>
                </div>
              </div>
            </div>
          )}

          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`msg-row ${msg.role}`}>
              {msg.role === 'assistant' && <div className="avatar assistant-avatar"><RobotIcon size={16} /></div>}
              <div className={`msg-bubble ${msg.role}`}>
                <div>{renderFormattedText(msg.text)}</div>
                <div className="msg-actions">
                  {msg.role === 'assistant' && (
                    <>
                      <button className="icon-action-btn" title="Copy" onClick={() => handleCopy(msg.text, idx)}>
                        {copiedIdx === idx ? '✓' : '⧉'}
                      </button>
                      <button className="icon-action-btn" title="Listen" onClick={() => handleListen(msg.text)}>🔊</button>
                    </>
                  )}
                  <span className="msg-time">{msg.time} {msg.role === 'user' && '✓✓'}</span>
                </div>
              </div>
              {msg.role === 'user' && <div className="avatar user-avatar">P</div>}
            </div>
          ))}

          {asking && (
            <div className="msg-row assistant">
              <div className="avatar assistant-avatar"><RobotIcon size={16} /></div>
              <div className="msg-bubble assistant typing-bubble">
                <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>

        {recording && (
          <div className="live-recording-bar">
            <div className="pulse-dot"></div>
            <div className="waveform">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className="live-caption">{liveCaption ? liveCaption : "Listening..."}</div>
            <button className="cancel-record-btn" onClick={cancelRecording} title="Cancel">🗑</button>
            <button className="confirm-record-btn" onClick={confirmRecording} title="Send">✓</button>
          </div>
        )}

        {/* Input bar */}
        {(simplified || generalChat) && (
          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="chat-text-input"
              placeholder="Ask anything about your document..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={recording}
            />
            <button className="mic-btn" title="Ask by voice" onClick={startRecording} disabled={recording}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            <button className="send-btn" onClick={handleSendQuestion}>➤</button>
          </div>
        )}

        {/* Bottom tab bar */}
        <nav className="tabbar">
          <button className="tab-btn active">
            <span><ChatTabIcon size={18} /></span>
            Chat
          </button>
          <button className="tab-btn" onClick={() => document.getElementById('fileInput')?.click()}>
            <span><FolderTabIcon size={18} /></span>
            Files
          </button>
          <button className="tab-btn tab-btn-center" onClick={handleNewDocument}>
            <PlusTabIcon size={20} />
          </button>
          <button className="tab-btn" onClick={() => setShowHistory(true)}>
            <span><ClockTabIcon size={18} /></span>
            History
          </button>
          <button className="tab-btn">
            <span><UserTabIcon size={18} /></span>
            Profile
          </button>
        </nav>
      </div>
    </div>
  )
}

export default App