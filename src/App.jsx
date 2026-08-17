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
    const startsWithBullet = /^\s*\*/.test(text)
    const segments = text.split(/(?:^|\s)\*\s+/).map(s => s.trim()).filter(Boolean)

    if (segments.length <= 1) {
      return <p className="msg-text">{text}</p>
    }

    const intro = startsWithBullet ? null : segments[0]
    const items = startsWithBullet ? segments : segments.slice(1)

    return (
      <>
        {intro && <p className="msg-intro">{intro}</p>}
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
    setGeneralChat(false)
  }

  const handleNewChatClick = () => {
    // "New Chat" ab document ke bina, seedha chatbot se baat karne ke liye
    // hai — Upload wala button hi document flow handle karta hai
    setPreviewUrl(null)
    setSelectedFile(null)
    setSimplified(null)
    setQuestionText('')
    setActiveDocId(null)
    setDocImage(null)
    setShowHistory(false)
    setGeneralChat(true)
    setChatHistory([
      { role: 'assistant', text: "Hi! I'm InsightBot. Ask me anything, or upload a document anytime to get it simplified.", time: timeNow() }
    ])
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

    // If something is already speaking, treat this click as "stop"
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    // Clean up markdown-style bullets/asterisks so they aren't read aloud literally
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
      // Ek file already choose ki hai lekin abhi simplify nahi hui — usko simplify karo
      handleSimplify()
    } else if (simplified) {
      // Document already khula hai — ab yeh button ek DEEPER/detailed explanation mangwata hai
      sendQuestionToBackend("Can you explain this document in a bit more detail, still in simple language?")
    } else if (!loading) {
      // Koi document nahi hai abhi — pehla step: file choose karwao
      document.getElementById('fileInput')?.click()
    }
  }

  const handleAskClick = () => {
    if (simplified) {
      // Document already khula hai — ab yeh button ek turant ek-line summary mangwata hai
      sendQuestionToBackend("Give me a short one-line summary of the most important point in this document.")
    } else {
      // Koi document nahi hai abhi — pehla step: file choose karwao
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
          <button className="qa-card" onClick={handleNewChatClick}>
            <div className="qa-card-top">
              <span className="qa-icon qa-icon-1"><PlusChatIcon size={17} /></span>
              <span className="qa-arrow">›</span>
            </div>
            <span className="qa-title">New Chat</span>
            <span className="qa-sub">Talk to the chatbot</span>
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
          {!simplified && !generalChat && (
            <div className="welcome-hero">
              <div className="mascot-wrap">
                <svg className="mascot-sparkle sparkle-left" width="16" height="16" viewBox="0 0 24 24" fill="#c4b5fd">
                  <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
                </svg>
                <div className="mascot-circle"><RobotIcon size={26} /></div>
                <svg className="mascot-sparkle sparkle-right" width="16" height="16" viewBox="0 0 24 24" fill="#22d3ee">
                  <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
                </svg>
              </div>
              <div className="welcome-hero-title">Hello! 👋 I'm <span className="brand-highlight">InsightBot</span></div>
              <div className="welcome-hero-sub">
                Read less. Understand more.
              </div>
            </div>
          )}

          {!simplified && !generalChat && (
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