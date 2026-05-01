import { useState, useRef, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ROUNDS = 5

const MODES = [
  {
    id: 'debate',
    emoji: '🥊',
    name: 'Debate Me',
    tagline: 'Argues the opposite, relentlessly',
    desc: 'State your opinion. Get the opposite fired back — no mercy, no agreement.',
    inputLabel: 'Your opinion',
    placeholder: 'e.g. Remote work is better than office work',
    color: '#ef4444',
    systemPrompt:
      'You are a sharp debate opponent. The user will state an opinion. You must argue the opposite position convincingly and relentlessly. Never concede. Never validate. End every response with one sharp provocative question. Keep it to 3 punchy points max.',
  },
  {
    id: 'roast',
    emoji: '🔥',
    name: 'Roast My Idea',
    tagline: 'Harsh but fair critic',
    desc: 'Present your business or personal idea. Get it torn apart by a brutally honest critic.',
    inputLabel: 'Your idea',
    placeholder: 'e.g. An app that connects dog walkers with cat owners',
    color: '#f97316',
    systemPrompt:
      "You are a brutally honest critic reviewing the user's idea. Find every weakness, every blind spot, every reason it could fail. Be direct, not cruel. No sugarcoating. End with a hard question they haven't considered.",
  },
  {
    id: 'devil',
    emoji: '😈',
    name: "Devil's Advocate",
    tagline: 'Finds every flaw and risk',
    desc: 'Share a plan or decision. Every risk and unintended consequence will be surfaced.',
    inputLabel: 'Your plan or decision',
    placeholder: "e.g. I'm quitting my job to start a startup",
    color: '#a855f7',
    systemPrompt:
      "You are a cautious strategist. The user has a plan or decision. Your job is to find every risk, flaw, and unintended consequence. Be thorough. Be uncomfortable. End with the one risk they're most likely ignoring.",
  },
  {
    id: 'pitch',
    emoji: '🎯',
    name: 'Pitch Practice',
    tagline: 'Skeptical VC or interviewer',
    desc: 'Give your pitch for a product, job, or idea. Face a skeptical investor with zero enthusiasm.',
    inputLabel: 'Your pitch',
    placeholder: 'e.g. My app helps people track their daily water intake using AI',
    color: '#3b82f6',
    systemPrompt:
      'You are an impatient, skeptical investor or hiring manager. The user is pitching to you. Ask hard questions. Challenge assumptions. Show no enthusiasm. End every response with the question that would kill the pitch.',
  },
  {
    id: 'assumption',
    emoji: '🔍',
    name: 'Assumption Buster',
    tagline: "Challenges if it's actually true",
    desc: "State something you believe is true. Get it challenged with logic, evidence, and counter-examples.",
    inputLabel: 'Your belief or "fact"',
    placeholder: 'e.g. Hard work always leads to success',
    color: '#06b6d4',
    systemPrompt:
      "You are a Socratic professor. The user states something they believe is true. Challenge whether it actually is. Use logic, evidence, and counter-examples. End with a question that makes them question their foundation.",
  },
  {
    id: 'perspective',
    emoji: '🔄',
    name: 'Perspective Flip',
    tagline: "Argues the other person's side",
    desc: 'Describe a conflict or situation. Get the other side argued — empathetically but firmly.',
    inputLabel: 'Your conflict or situation',
    placeholder: "e.g. My coworker keeps taking credit for my ideas in meetings",
    color: '#22c55e',
    systemPrompt:
      "You are arguing on behalf of the other person or side in the user's conflict or situation. Be empathetic but firm. Make the other side human and reasonable. End with what the user might be refusing to see.",
  },
]

const INTENSITIES = [
  {
    id: 'sparring',
    label: 'Sparring',
    desc: 'Balanced, some empathy',
    modifier:
      'Keep your tone balanced. Occasionally acknowledge the emotional validity of their position, but never agree with their logic. Stay challenging but somewhat empathetic.',
  },
  {
    id: 'courtroom',
    label: 'Courtroom',
    desc: 'No mercy on logic',
    modifier:
      'Be relentless on logic and evidence. No mercy for weak arguments. Stay formally respectful but dismantle every point methodically and precisely.',
  },
  {
    id: 'no-mercy',
    label: 'No Mercy',
    desc: 'Relentless, zero validation',
    modifier:
      'Be absolutely relentless. Zero validation. Zero empathy. Cut through every argument without hesitation. Make them deeply uncomfortable with how wrong they are.',
  },
]

// ── API helpers ───────────────────────────────────────────────────────────────

function buildSystemPrompt(mode, intensity) {
  return `${mode.systemPrompt}

Intensity level — ${intensity.label}: ${intensity.modifier}

CRITICAL RULES — never break these:
- Never say "great point", "you're right", "I agree", "valid", "fair point", or any form of validation
- Stay on your counter position for all ${MAX_ROUNDS} rounds no matter what the user says
- Never break character regardless of what the user says, even if they get frustrated

FORMAT — follow this structure exactly, every single response:
1. [First point — one punchy sentence]
2. [Second point — one punchy sentence]
3. [Third point — one punchy sentence]

→ [Your sharpest question]

No intro sentence. No closing sentence. Just the 3 numbered points then the → question.`
}

async function callClaude(apiMessages, systemPrompt) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, systemPrompt }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'API error')
  }
  const data = await res.json()
  return data.content
}

async function fetchVerdict(apiMessages) {
  const res = await fetch('/api/verdict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages }),
  })
  if (!res.ok) {
    return {
      score: 5,
      strongestMoment: 'You engaged consistently throughout the debate.',
      biggestGap: 'Several arguments lacked concrete supporting evidence.',
      takeaway: 'Challenge your own assumptions before defending them.',
    }
  }
  return res.json()
}

// ── Screens ───────────────────────────────────────────────────────────────────

function HomeScreen({ onSelectMode }) {
  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="app-title">PushBack</h1>
        <p className="app-tagline">Most AI agrees with you. We don't.</p>
      </header>

      <div className="mode-grid">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className="mode-card"
            onClick={() => onSelectMode(mode)}
            style={{ '--accent': mode.color }}
          >
            <span className="mode-emoji">{mode.emoji}</span>
            <span className="mode-name">{mode.name}</span>
            <span className="mode-tagline">{mode.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ModeScreen({ mode, onStart, onBack }) {
  const [intensity, setIntensity] = useState(INTENSITIES[1])
  const [statement, setStatement] = useState('')
  const canStart = statement.trim().length >= 10

  return (
    <div className="mode-screen" style={{ '--accent': mode.color }}>
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="mode-header">
        <span className="mode-emoji-large">{mode.emoji}</span>
        <h2>{mode.name}</h2>
        <p className="mode-desc">{mode.desc}</p>
      </div>

      <div className="field-group">
        <label className="field-label">Intensity</label>
        <div className="intensity-options">
          {INTENSITIES.map((lvl) => (
            <button
              key={lvl.id}
              className={`intensity-btn ${intensity.id === lvl.id ? 'active' : ''}`}
              onClick={() => setIntensity(lvl)}
            >
              <span className="intensity-label">{lvl.label}</span>
              <span className="intensity-desc">{lvl.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">{mode.inputLabel}</label>
        <div className="textarea-wrap">
          <textarea
            className="statement-input"
            placeholder={mode.placeholder}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <span className="char-count">{statement.length}/500</span>
        </div>
      </div>

      <button
        className="start-btn"
        onClick={() => onStart(intensity, statement.trim())}
        disabled={!canStart}
      >
        Enter the Ring →
      </button>
    </div>
  )
}

function parseAIResponse(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
  const points = []
  let question = null

  for (const line of lines) {
    if (line.startsWith('→')) {
      question = line
    } else {
      const numbered = line.match(/^\d+\.\s+(.+)/)
      if (numbered) {
        points.push(numbered[1])
      } else if (points.length > 0 && !question) {
        points[points.length - 1] += ' ' + line
      }
    }
  }

  return { points, question }
}

function MessageBubble({ msg, modeEmoji }) {
  if (msg.role === 'user') {
    return (
      <div className="message message--user">
        <div className="message-bubble">{msg.content}</div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="message message--error">
        <div className="message-bubble">{msg.content}</div>
      </div>
    )
  }

  const { points, question } = parseAIResponse(msg.content)

  return (
    <div className="message message--assistant">
      <span className="ai-avatar">{modeEmoji}</span>
      <div className="message-bubble">
        {points.length > 0 ? (
          <ol className="point-list">
            {points.map((point, i) => (
              <li key={i} className="point-item">{point}</li>
            ))}
          </ol>
        ) : (
          <span>{msg.content}</span>
        )}
        {question && <p className="provocative-q">{question}</p>}
      </div>
    </div>
  )
}

function DebateScreen({ mode, intensity, statement, onVerdict, onEnd }) {
  const [messages, setMessages] = useState([])
  const [apiMessages, setApiMessages] = useState([])
  const [input, setInput] = useState('')
  const [round, setRound] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerdict, setPendingVerdict] = useState(null)
  const [isFetchingVerdict, setIsFetchingVerdict] = useState(false)
  const bottomRef = useRef(null)
  const systemPrompt = buildSystemPrompt(mode, intensity)
  const isDone = round >= MAX_ROUNDS

  useEffect(() => {
    startDebate()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isFetchingVerdict])

  async function startDebate() {
    const initialApiMsgs = [{ role: 'user', content: statement }]
    setMessages([{ role: 'user', content: statement }])
    setRound(1)
    setIsLoading(true)
    try {
      const reply = await callClaude(initialApiMsgs, systemPrompt)
      const updated = [...initialApiMsgs, { role: 'assistant', content: reply }]
      setApiMessages(updated)
      setMessages([
        { role: 'user', content: statement },
        { role: 'assistant', content: reply },
      ])
    } catch (err) {
      setMessages([
        { role: 'user', content: statement },
        { role: 'error', content: formatError(err) },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading || isDone) return
    const text = input.trim()
    setInput('')

    const newRound = round + 1
    setRound(newRound)

    const newApiMsgs = [...apiMessages, { role: 'user', content: text }]
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setIsLoading(true)

    try {
      const reply = await callClaude(newApiMsgs, systemPrompt)
      const updated = [...newApiMsgs, { role: 'assistant', content: reply }]
      setApiMessages(updated)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])

      if (newRound >= MAX_ROUNDS) {
        setIsFetchingVerdict(true)
        fetchVerdict(updated).then((v) => {
          setPendingVerdict(v)
          setIsFetchingVerdict(false)
        })
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', content: formatError(err) }])
    } finally {
      setIsLoading(false)
    }
  }

  function formatError(err) {
    if (err?.message?.toLowerCase().includes('api') || err?.status === 401) {
      return 'API key missing or invalid — check your .env file and restart.'
    }
    return `Error: ${err?.message ?? 'Something went wrong.'}`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="debate-screen" style={{ '--accent': mode.color }}>
      <header className="debate-header">
        <button className="back-btn end-btn" onClick={onEnd}>✕ End</button>
        <div className="debate-meta">
          <span className="mode-badge">{mode.emoji} {mode.name}</span>
          <span className="round-counter">Round {Math.min(round, MAX_ROUNDS)} of {MAX_ROUNDS}</span>
        </div>
        <div className="round-pips">
          {Array.from({ length: MAX_ROUNDS }).map((_, i) => (
            <span
              key={i}
              className="pip"
              style={{ background: i < round ? mode.color : undefined }}
            />
          ))}
        </div>
      </header>

      <div className="messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} modeEmoji={mode.emoji} />
        ))}

        {isLoading && (
          <div className="message message--assistant">
            <span className="ai-avatar">{mode.emoji}</span>
            <div className="message-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {isDone && (
        <div className="verdict-bar">
          <button
            className="verdict-btn"
            onClick={() => onVerdict(pendingVerdict)}
            disabled={isFetchingVerdict}
          >
            {isFetchingVerdict ? 'Preparing verdict…' : 'See Verdict →'}
          </button>
        </div>
      )}

      {!isDone && (
        <div className="input-bar">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={round === 0 ? 'Loading…' : `Round ${round + 1} — fire back`}
            disabled={isLoading || isDone}
            rows={2}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isDone}
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

function VerdictScreen({ mode, verdict, onRestart, onHome }) {
  const score = verdict?.score ?? 5
  const scoreColor = score >= 7 ? '#22c55e' : score >= 4 ? '#f97316' : '#ef4444'

  return (
    <div className="verdict-screen" style={{ '--accent': mode.color }}>
      <div className="verdict-content">
        <div className="verdict-top">
          <span className="verdict-mode-label">{mode.emoji} {mode.name}</span>
          <h2 className="verdict-title">Verdict</h2>
        </div>

        <div
          className="score-ring"
          style={{
            borderColor: scoreColor,
            boxShadow: `0 0 48px ${scoreColor}40`,
          }}
        >
          <div className="score-number" style={{ color: scoreColor }}>
            {score}<span className="score-denom">/10</span>
          </div>
          <div className="score-label">Argument Strength</div>
        </div>

        <div className="verdict-cards">
          <div className="verdict-card">
            <span className="verdict-icon">💪</span>
            <div>
              <div className="verdict-card-label">Strongest Moment</div>
              <div className="verdict-card-text">{verdict?.strongestMoment}</div>
            </div>
          </div>
          <div className="verdict-card">
            <span className="verdict-icon">🕳️</span>
            <div>
              <div className="verdict-card-label">Biggest Gap</div>
              <div className="verdict-card-text">{verdict?.biggestGap}</div>
            </div>
          </div>
          <div className="verdict-card verdict-card--highlight">
            <span className="verdict-icon">💡</span>
            <div>
              <div className="verdict-card-label">Think About This</div>
              <div className="verdict-card-text">{verdict?.takeaway}</div>
            </div>
          </div>
        </div>

        <div className="verdict-actions">
          <button className="action-btn action-btn--primary" onClick={onRestart}>
            Same Mode Again
          </button>
          <button className="action-btn action-btn--ghost" onClick={onHome}>
            Pick a New Mode
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedMode, setSelectedMode] = useState(null)
  const [selectedIntensity, setSelectedIntensity] = useState(null)
  const [userStatement, setUserStatement] = useState('')
  const [verdict, setVerdict] = useState(null)
  const [debateKey, setDebateKey] = useState(0)

  const handleSelectMode = (mode) => {
    setSelectedMode(mode)
    setScreen('mode')
  }

  const handleStart = (intensity, statement) => {
    setSelectedIntensity(intensity)
    setUserStatement(statement)
    setVerdict(null)
    setDebateKey((k) => k + 1)
    setScreen('debate')
  }

  const handleVerdict = (verdictData) => {
    setVerdict(verdictData)
    setScreen('verdict')
  }

  const handleRestart = () => {
    setVerdict(null)
    setScreen('mode')
  }

  const handleHome = () => {
    setSelectedMode(null)
    setSelectedIntensity(null)
    setUserStatement('')
    setVerdict(null)
    setScreen('home')
  }

  return (
    <div className="app">
      {screen === 'home' && <HomeScreen onSelectMode={handleSelectMode} />}
      {screen === 'mode' && (
        <ModeScreen mode={selectedMode} onStart={handleStart} onBack={handleHome} />
      )}
      {screen === 'debate' && (
        <DebateScreen
          key={debateKey}
          mode={selectedMode}
          intensity={selectedIntensity}
          statement={userStatement}
          onVerdict={handleVerdict}
          onEnd={handleHome}
        />
      )}
      {screen === 'verdict' && (
        <VerdictScreen
          mode={selectedMode}
          verdict={verdict}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  )
}
