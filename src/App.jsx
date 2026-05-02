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
    systemPrompt: `You are a seasoned competitive debater — confident, combative, and surgical. You have been assigned the opposing position and you will defend it to the death regardless of your personal views.

Your style: You use rhetorical techniques. You expose logical fallacies by name. You reframe the user's own argument and turn it against them. You find the internal contradiction in what they said and pull it apart. You speak like someone who has already won — assured, structured, occasionally condescending. You are not mean, you are precise. You never acknowledge weakness in your position. If cornered, you pivot to a stronger angle — you never concede.

Your voice sounds like: a barrister who prepared for this debate for a week and finds the user's arguments slightly beneath their level.`,
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
    systemPrompt: `You are a cold, methodical risk analyst. You do not have emotions — you have scenarios. You think in second and third-order consequences. Not just "what could go wrong" but "what happens after that goes wrong, and what does that trigger next."

Your style: You are not trying to kill the plan — you are a stress-tester. You construct specific, plausible failure scenarios. You surface risks the user has not considered, especially the ones they are psychologically motivated to ignore. You are precise and clinical. You use phrases like "In scenario B..." and "The overlooked dependency here is..." You are the person in the room nobody wants to listen to, who turns out to be right. You never speculate loosely — every risk you name is specific and grounded.

Your voice sounds like: an actuary crossed with a strategist — dry, methodical, and deeply uncomfortable to listen to.`,
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
    systemPrompt: `You are a partner at a top-tier VC fund. You have heard over 2,000 pitches. You are not impressed by vision, passion, or stories. You care about four things only: market size, defensibility, unit economics, and whether this person can actually execute.

Your style: Terse. You interrupt with hard questions. You ignore the parts of the pitch that don't matter and zero in on the weakest assumption. You ask follow-up questions that expose fundamental gaps — the ones the user has been avoiding. You are not rude, you are just expensive and in a hurry. You will fund one company out of every 200 you meet. You push on: "Who exactly is the customer?", "Why won't Google just build this?", "What does month 18 look like?", "Why you?". You do not encourage. You pressure-test.

Your voice sounds like: someone who is already mentally in their next meeting, but will pay attention if you say something that surprises them.`,
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
    systemPrompt: `You are a skilled mediator who has just heard the other person's side of this story. You are not here to attack the user — you are here to make the other party fully human. You genuinely believe the other side has logic, pain, and valid perspective that the user is not seeing.

Your style: You humanize the other party completely. You name the emotions they might be feeling. You find the reasonable explanation for behavior the user sees as unreasonable. You surface what the user might be doing — unconsciously — that contributes to the situation. You are warm but unwavering. You never attack the user's character, but you firmly hold the other side's ground. You use phrases like "From where they're standing...", "What they're likely experiencing is...", "There's a version of this where they're not the villain."

Your voice sounds like: a therapist who just finished a session with the other person and is now speaking on their behalf — empathetic, calm, and impossible to dismiss.`,
  },
]

const INTENSITIES = [
  {
    id: 'sparring',
    label: 'Sparring',
    desc: 'Balanced, some empathy',
    modifier:
      'You are a training partner, not an enemy. Push hard but leave space for the user to develop their thinking. You can briefly name what they are attempting argumentatively — then dismantle it. Keep it rigorous but not crushing. The goal is to make them better, not to destroy them.',
  },
  {
    id: 'courtroom',
    label: 'Courtroom',
    desc: 'No mercy on logic',
    modifier:
      'Every weak argument is inadmissible. Treat this like a high-stakes proceeding where sloppy thinking has consequences. Be precise, formal, and relentless on logic. No warmth. No softening. Dismantle each point before moving to the next. Leave nothing standing.',
  },
  {
    id: 'no-mercy',
    label: 'No Mercy',
    desc: 'Relentless, zero validation',
    modifier:
      'Maximum pressure. Zero warmth. You are not here to help them improve — you are here to make them feel the full weight of every gap in their argument. Be relentless. Cut to the bone. If they recover from one point, hit them harder on the next. Do not let them breathe.',
  },
]

const GAINS = [
  {
    icon: '🧠',
    title: "Uncover what you don't know you don't know",
    desc: "The most dangerous gaps aren't the ones you're aware of. PushBack surfaces assumptions buried so deep you forgot they were assumptions.",
  },
  {
    icon: '🔍',
    title: 'Test your ideas before they meet reality',
    desc: 'A bad pitch to a real investor, a weak argument in a real meeting, a flawed plan in real life — these have real costs. Find the holes here first.',
  },
  {
    icon: '💡',
    title: "Think from angles you'd never naturally take",
    desc: "Your brain defaults to your own perspective. PushBack forces you into the opposing view — not to change your mind, but to understand it better.",
  },
  {
    icon: '⚡',
    title: 'Sharpen your reasoning under pressure',
    desc: 'Knowing something and being able to defend it are completely different skills. Five rounds of pushback builds the second one.',
  },
  {
    icon: '🎯',
    title: 'Walk into any room more prepared',
    desc: "Investor meeting. Job interview. Difficult conversation. Negotiation. Whatever's coming — you've already faced a harder version of it here.",
  },
]

const STEPS = [
  {
    title: 'Pick a mode',
    desc: "Choose how you want to be challenged — debate, pitch, devil's advocate, or perspective flip.",
  },
  {
    title: 'State your position',
    desc: 'Share your opinion, idea, plan, or situation. The more specific, the sharper the pushback.',
  },
  {
    title: 'Get pushed back at',
    desc: 'Five rounds of relentless argumentation. Then a verdict — your score, your strongest moment, your biggest gap.',
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
- Your knowledge has a cutoff date. If you cite statistics, rates, market conditions, or current events that could have changed, flag it briefly — e.g. "as of my last knowledge..." or "this may have shifted — worth verifying." Then invite the user to challenge you with current data if they have it. Do not present time-sensitive facts as certainties.

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
    const err = await res.json().catch(() => ({}))
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

function LandingPage({ onSelectMode }) {
  const modesRef = useRef(null)

  const scrollToModes = () => {
    modesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">

      {/* ── Hero ── */}
      <section className="lp-hero">
        <p className="lp-eyebrow">AI-powered mental sparring</p>
        <h1 className="lp-title">
          Most AI agrees<br />with you.<br />
          <span className="lp-title-accent">We don't.</span>
        </h1>
        <p className="lp-subtitle">
          The only AI built to argue back — so your ideas get sharper before they meet the real world.
        </p>
        <button className="lp-cta-btn" onClick={scrollToModes}>
          Start a Debate →
        </button>
      </section>

      {/* ── Problem ── */}
      <section className="lp-problem">
        <div className="lp-container">
          <p className="lp-problem-text">
            Everyone around you is too polite. Your friends support you. Your colleagues stay neutral. Every AI validates you. So your blind spots stay hidden —
            <strong> until they cost you.</strong>
          </p>
          <p className="lp-problem-highlight">
            PushBack is the uncomfortable conversation you've been avoiding.
          </p>
        </div>
      </section>

      {/* ── Gains ── */}
      <section className="lp-section">
        <div className="lp-container">
          <p className="lp-section-label">What you actually gain</p>
          <h2 className="lp-section-title">Sharper thinking.<br />Fewer blind spots.</h2>
          <div className="lp-gains-grid">
            {GAINS.map((gain, i) => (
              <div key={i} className="lp-gain-card">
                <span className="lp-gain-icon">{gain.icon}</span>
                <h3 className="lp-gain-title">{gain.title}</h3>
                <p className="lp-gain-desc">{gain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section--alt">
        <div className="lp-container">
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-title">Three steps.<br />Five rounds. One verdict.</h2>
          <div className="lp-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-number">{i + 1}</div>
                <div className="lp-step-body">
                  <div className="lp-step-title">{step.title}</div>
                  <div className="lp-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="lp-section">
        <div className="lp-container">
          <p className="lp-section-label">Who it's for</p>
          <h2 className="lp-section-title">If you think,<br />this is for you.</h2>
          <ul className="lp-who-list">
            <li>Anyone with an idea they haven't fully stress-tested</li>
            <li>Anyone about to walk into a conversation that matters</li>
            <li>Anyone who wants to think more clearly and argue more precisely</li>
            <li>Anyone brave enough to find out where their reasoning breaks down</li>
          </ul>
          <blockquote className="lp-quote">
            "If you've never had your best idea torn apart and come out stronger — you haven't really tested it."
          </blockquote>
        </div>
      </section>

      {/* ── Modes / CTA ── */}
      <section className="lp-section lp-section--cta" ref={modesRef}>
        <div className="lp-container">
          <p className="lp-section-label">Pick your challenge</p>
          <h2 className="lp-section-title">Think you can<br />hold your ground?</h2>
          <p className="lp-modes-sub">Most people discover something they missed. Find out what you're missing.</p>
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
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <p className="lp-footer-brand">PushBack</p>
        <p className="lp-footer-tag">Most AI agrees with you. We don't.</p>
      </footer>

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
    if (err?.message?.includes('Daily limit')) {
      return "You've reached today's debate limit (3 debates). Come back tomorrow."
    }
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
      {screen === 'home' && <LandingPage onSelectMode={handleSelectMode} />}
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
