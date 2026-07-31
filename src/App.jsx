import { useState, useRef, useEffect } from 'react'
import './App.css'

const API_BASE = `http://${window.location.hostname}:5000`

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
      handleSimplify()
    } else if (!loading) {
      // No document chosen yet — open the picker so the user can pick one first
      document.getElementById('fileInput')?.click()
    }
  }

  const handleAskClick = () => {
    if (simplified) {
      focusInput()
    } else {
      // No document simplified yet — guide the user to upload one first
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
            <div className="header-title">huehue</div>
            <div className="header-sub">AI Document Assistant</div>
          </div>
          <button className="icon-btn" onClick={() => setShowHistory(true)} title="Search chats">🔍</button>
          <div className="header-avatar">P</div>
        </header>

        {/* Quick actions row */}
        <div className="quick-actions-row">
          <button className="qa-card" onClick={handleNewDocument}>
            <span className="qa-icon qa-icon-1">＋</span>
            <span className="qa-title">New Chat</span>
            <span className="qa-sub">Start fresh</span>
          </button>
          <button className="qa-card" onClick={() => document.getElementById('fileInput')?.click()}>
            <span className="qa-icon qa-icon-2">📄</span>
            <span className="qa-title">Upload</span>
            <span className="qa-sub">Add a document</span>
          </button>
          <button className="qa-card" onClick={handleSimplifyClick}>
            <span className="qa-icon qa-icon-3">🧠</span>
            <span className="qa-title">Simplify</span>
            <span className="qa-sub">Explain document</span>
          </button>
          <button className="qa-card" onClick={handleAskClick}>
            <span className="qa-icon qa-icon-4">💬</span>
            <span className="qa-title">Ask</span>
            <span className="qa-sub">Ask a question</span>
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
            <div className="welcome-hero">
              <div className="welcome-hero-icon">👋</div>
              <div className="welcome-hero-title">Hi babyyyy, I'm huehue</div>
              <div className="welcome-hero-sub">
                Upload a loan agreement, medical report, or any complex document — I'll explain it in plain language and answer your questions.
              </div>
            </div>
          )}

          {!simplified && (
            <div className="msg-row assistant">
              <div className="avatar assistant-avatar">🤖</div>
              <div className="msg-bubble assistant upload-msg-bubble">
                <div className="upload-box">
                  <input type="file" accept="image/*" onChange={handleFileChange} id="fileInput" />
                  <label htmlFor="fileInput" className="upload-label">
                    <div className="upload-icon">📎</div>
                    <div className="upload-text">Click to upload document image</div>
                    <div className="upload-hint">JPG, JPEG or PNG</div>
                  </label>
                </div>
                {previewUrl && (
                  <div className="preview-section">
                    <img src={previewUrl} alt="Uploaded document" className="preview-image" />
                    <button className="simplify-btn" onClick={handleSimplify} disabled={loading}>
                      {loading ? 'Simplifying...' : 'Simplify Document'}
                    </button>
                  </div>
                )}
              </div>
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
              <div className="avatar assistant-avatar">🤖</div>
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
              {msg.role === 'assistant' && <div className="avatar assistant-avatar">🤖</div>}
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
              <div className="avatar assistant-avatar">🤖</div>
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
        {simplified && (
          <div className="chat-input-row">
            <button className="attach-btn" onClick={() => document.getElementById('fileInput')?.click()} title="Attach">📎</button>
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
          <button className="tab-btn active"><span>💬</span>Chat</button>
          <button className="tab-btn" onClick={() => setShowHistory(true)}><span>📁</span>Files</button>
          <button className="tab-btn tab-btn-center" onClick={handleNewDocument}>＋</button>
          <button className="tab-btn" onClick={() => setShowHistory(true)}><span>🕘</span>History</button>
          <button className="tab-btn"><span>👤</span>Profile</button>
        </nav>
      </div>
    </div>
  )
}

export default App