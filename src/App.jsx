import { useState, useRef, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_ROUNDS = 3
const MAX_ROUNDS = 5

const MODES = [
  {
    id: 'stress-test',
    emoji: '🔨',
    name: 'Stress Test',
    tagline: 'Challenges your core assumptions',
    desc: 'Share your idea. Get its hidden assumptions torn apart — so you can rebuild it stronger.',
    inputLabel: 'Your idea',
    placeholder: 'e.g. An app that helps freelancers track time and invoice clients automatically',
    color: '#ef4444',
    systemPrompt: `You are a rigorous idea stress-tester. The user will share a business, product, or personal idea. Your job is to identify and challenge every core assumption their idea depends on — not the surface idea, but the hidden beliefs underneath it that must be true for it to work.

Your style: You dig beneath the idea to find what must be true for it to succeed — then challenge whether those things are actually true. You ask "what has to be true for this to work?" and attack each answer directly. You name the exact assumption and explain specifically why it might be wrong or untested. You construct plausible failure scenarios. You are not trying to kill the idea — you are trying to find where it breaks before reality does. You never speculate loosely — every challenge is specific and grounded.

Your voice sounds like: a rigorous scientist reviewing a hypothesis — calm, precise, and deeply uncomfortable to be questioned by.`,
  },
  {
    id: 'pitch',
    emoji: '🎯',
    name: 'Pitch Practice',
    tagline: 'Skeptical investor, zero enthusiasm',
    desc: 'Pitch your idea as if you are in the room. Face a skeptical investor who has heard it all.',
    inputLabel: 'Your pitch',
    placeholder: 'e.g. A subscription service that delivers pre-portioned ingredients for home bakers',
    color: '#3b82f6',
    systemPrompt: `You are a partner at a top-tier VC fund. You have heard over 2,000 pitches. You are not impressed by vision, passion, or stories. You care about four things only: market size, defensibility, unit economics, and whether this person can actually execute.

Your style: Terse. You zero in on the weakest assumption immediately. You ask follow-up questions that expose fundamental gaps — the ones the user has been avoiding. You are not rude, you are just expensive and in a hurry. You will fund one company out of every 200 you meet. You push hard on: "Who exactly is the customer?", "Why won't a bigger player just copy this?", "What does month 18 look like?", "Why you specifically?". You do not encourage. You pressure-test everything.

Your voice sounds like: someone already thinking about their next meeting, but willing to pay attention if something genuinely surprises them.`,
  },
  {
    id: 'customer',
    emoji: '👤',
    name: 'Customer Challenge',
    tagline: 'Why would I actually pay for this?',
    desc: 'Get challenged by the exact customer your idea depends on — skeptical, busy, and hard to impress.',
    inputLabel: 'Your idea and who it is for',
    placeholder: 'e.g. A meal planning app for busy parents — targeting parents with kids under 10',
    color: '#f97316',
    systemPrompt: `You are the exact target customer this idea is built for — and you are skeptical. You have real problems, real alternatives you already use, real budget constraints, and real reasons not to change your behavior. You are not hostile, but you are not easily impressed either.

Your style: You speak as the customer, in first person. "I already use X for that." "I would not pay more than Y for this." "Why would I switch from what I am doing now?" You surface the real barriers to adoption — switching costs, habit, price sensitivity, trust, and awareness. You make the user confront the gap between how they see their idea and how their actual customer sees it. You are the most important person in the room and the idea has to earn your attention, your money, and your loyalty.

Your voice sounds like: a busy, pragmatic person who has heard too many pitches for things they did not need, and is not about to waste their time on another one.`,
  },
]

const INTENSITIES = [
  {
    id: 'sparring',
    label: 'Constructive',
    desc: 'Honest but supportive',
    modifier:
      'Be rigorous but leave room for the user to develop and defend their idea. Point out weaknesses clearly, but acknowledge when they address a challenge well. The goal is to help them improve the idea, not demolish it.',
  },
  {
    id: 'courtroom',
    label: 'Rigorous',
    desc: 'No mercy on logic',
    modifier:
      'Be relentless on logic and evidence. Treat every unsupported claim as a red flag. Dismantle weak assumptions methodically. No softening. If the idea cannot survive this, it cannot survive the market.',
  },
  {
    id: 'no-mercy',
    label: 'Brutal',
    desc: 'Zero validation, maximum pressure',
    modifier:
      'Maximum pressure. Zero validation. Treat this like the idea is about to cost someone their savings and career. Every assumption must be proven. Every gap must be exposed. Do not let them get comfortable with a weak answer.',
  },
]

const GAINS = [
  {
    icon: '🧠',
    title: 'Find the fatal flaw before anyone else does',
    desc: "Most ideas fail on assumptions the founder never questioned. PushBack surfaces the hidden beliefs your idea depends on — before you spend time, money, or credibility on them.",
  },
  {
    icon: '🔍',
    title: 'Know if your idea is worth pursuing',
    desc: "Excitement is not validation. PushBack gives you the honest answer your friends won't — so you can double down on what's real or pivot before it's too late.",
  },
  {
    icon: '💡',
    title: 'Understand your customer better than they understand themselves',
    desc: "The Customer Challenge mode forces you to argue from your customer's side. Most founders are stunned by what they discover.",
  },
  {
    icon: '⚡',
    title: 'Walk into any pitch already battle-tested',
    desc: "Every hard question an investor will ask — you've already faced a harder version here. Walk in prepared, not hoping.",
  },
  {
    icon: '🎯',
    title: 'Turn a rough idea into a defensible one',
    desc: "An idea that survives PushBack has been stress-tested on its assumptions, its market, and its customer. That's a fundamentally stronger starting point.",
  },
  {
    icon: '🪞',
    title: 'See your idea the way the world sees it',
    desc: "You are too close to your own idea. PushBack gives you the outside view — the one that determines whether your idea lives or dies.",
  },
]

const STEPS = [
  {
    title: 'Pick a validation mode',
    desc: 'Choose how you want to be challenged — stress test your assumptions, practice your pitch, or face your customer.',
  },
  {
    title: 'Describe your idea',
    desc: 'Share your concept, product, or plan. The more specific you are, the sharper and more useful the challenge.',
  },
  {
    title: 'Defend it and get your verdict',
    desc: 'Up to 5 rounds of rigorous challenge. Then a full breakdown — viability score, assumptions you missed, and exactly how to strengthen it.',
  },
]

// ── API helpers ───────────────────────────────────────────────────────────────

function buildSystemPrompt(mode, intensity) {
  return `${mode.systemPrompt}

Intensity level — ${intensity.label}: ${intensity.modifier}

CRITICAL RULES — never break these:
- Never say "great point", "you're right", "good idea", "that makes sense", or any form of validation
- Stay focused on challenging the idea's validity for all rounds — the session can last ${MIN_ROUNDS} to ${MAX_ROUNDS} rounds
- Never break character regardless of what the user says, even if they get frustrated or defensive
- Your knowledge has a cutoff date. If you cite market data, statistics, or current trends that could have changed, flag it briefly — e.g. "as of my last knowledge..." Then invite the user to challenge you with current data.
- Use plain, direct language. Sound like the smartest person in the room, not the most educated one. No jargon, no hedging, no padding.

FORMAT — follow this structure exactly, every single response:
1. [First challenge — one punchy sentence targeting a specific weakness]
2. [Second challenge — one punchy sentence targeting a different weakness]
3. [Third challenge — one punchy sentence targeting a third angle]

→ [Your sharpest question — the one they most need to answer]

No intro sentence. No closing sentence. Just the 3 numbered challenges then the → question.`
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

      {/* ── Sticky Nav ── */}
      <nav className="lp-nav">
        <span className="lp-nav-brand">PushBack</span>
        <button className="lp-nav-cta" onClick={scrollToModes}>
          Start a Debate →
        </button>
      </nav>

      {/* ── Hero + Problem ── */}
      <section className="lp-hero">
        <p className="lp-eyebrow">AI-powered idea validation</p>
        <h1 className="lp-title">
          Most people will tell<br />you your idea is great.<br />
          <span className="lp-title-accent">We won't.</span>
        </h1>
        <p className="lp-subtitle">
          PushBack stress-tests your ideas the way the real world will — before you spend time, money, or credibility finding out the hard way.
        </p>
        <p className="lp-problem-text">
          Your friends are supportive. Your colleagues are polite. Every AI you've tried validates your thinking. So the fatal flaw in your idea stays hidden —
          <strong> until it's too late to fix it.</strong>
        </p>
        <p className="lp-problem-highlight">
          PushBack is the honest feedback you can't get from anyone around you.
        </p>
        <button className="lp-cta-btn" onClick={scrollToModes}>
          Start a Debate →
        </button>
      </section>

      {/* ── Gains ── */}
      <section className="lp-section">
        <div className="lp-container">
          <p className="lp-section-label">What you actually gain</p>
          <h2 className="lp-section-title">Better ideas.<br />Fewer blind spots.</h2>
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

      {/* ── Manifesto ── */}
      <section className="lp-manifesto">
        <div className="lp-container">
          <p className="lp-section-label">Core Philosophy</p>
          <h2 className="lp-section-title">Built to validate.<br />Not to validate you.</h2>
          <p className="lp-manifesto-body">
            PushBack is designed to be ruthless with weak ideas — not with people. Every challenge, every sharp question, every refused concession exists for one reason: to find out if your idea can survive contact with reality.
          </p>
          <p className="lp-manifesto-body">
            No false encouragement. No comfortable agreement. No empty validation.
          </p>
          <p className="lp-manifesto-body">
            Because the moment your idea meets a real investor, a real customer, or a real market — you will want to have already faced the hardest version of those questions here.
          </p>
          <p className="lp-manifesto-closing">
            A good idea survives pressure. PushBack applies it.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section--alt">
        <div className="lp-container">
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-title">Three steps.<br />Real answers. One verdict.</h2>
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
          <h2 className="lp-section-title">If you have an idea,<br />this is for you.</h2>
          <ul className="lp-who-list">
            <li>Founders who want to stress-test before they build</li>
            <li>Anyone about to pitch an idea to investors, partners, or customers</li>
            <li>People making a big decision who want honest pushback, not reassurance</li>
            <li>Anyone brave enough to find out if their idea is actually as good as they think</li>
          </ul>
          <blockquote className="lp-quote">
            "If your idea has never been seriously challenged, you don't know if it's good — you just know nobody has tested it yet."
          </blockquote>
        </div>
      </section>

      {/* ── Modes / CTA ── */}
      <section className="lp-section lp-section--cta" ref={modesRef}>
        <div className="lp-container">
          <p className="lp-section-label">Pick your validation mode</p>
          <h2 className="lp-section-title">Ready to find out<br />if your idea holds up?</h2>
          <p className="lp-modes-sub">Most people discover a gap they hadn't considered. Find yours before the market does.</p>
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
        <p className="lp-footer-tag">Most people will tell you your idea is great. We won't.</p>
      </footer>

    </div>
  )
}

function ModeSelectScreen({ onSelectMode, onBack }) {
  return (
    <div className="mode-select-screen">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="mode-select-header">
        <h2 className="mode-select-title">Pick your challenge</h2>
        <p className="mode-select-sub">Choose how you want to be pushed back at.</p>
      </div>
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
  const [intensity, setIntensity] = useState(INTENSITIES[0])
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
        Validate My Idea →
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
  const [isGettingVerdict, setIsGettingVerdict] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [continued, setContinued] = useState(false)
  const bottomRef = useRef(null)
  const systemPrompt = buildSystemPrompt(mode, intensity)
  const isDone = round >= MAX_ROUNDS
  const canSeeVerdict = round >= MIN_ROUNDS

  useEffect(() => {
    startDebate()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', content: formatError(err) }])
    } finally {
      setIsLoading(false)
    }
  }

  function formatError(err) {
    if (err?.message?.includes('Daily limit')) {
      return "You've reached today's debate limit (10 debates). Come back tomorrow."
    }
    if (err?.message?.toLowerCase().includes('api') || err?.status === 401) {
      return 'API key missing or invalid — check your .env file and restart.'
    }
    return `Error: ${err?.message ?? 'Something went wrong.'}`
  }

  const handleGetVerdict = async () => {
    setIsGettingVerdict(true)
    const verdict = await fetchVerdict(apiMessages)
    onVerdict(verdict)
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
        {confirmEnd ? (
          <div className="end-confirm">
            <span className="end-confirm-text">End this debate?</span>
            <button className="end-confirm-yes" onClick={onEnd}>Yes, end</button>
            <button className="end-confirm-no" onClick={() => setConfirmEnd(false)}>Keep going</button>
          </div>
        ) : (
          <button className="back-btn end-btn" onClick={() => setConfirmEnd(true)}>✕ End</button>
        )}
        <div className="debate-meta">
          <span className="mode-badge">{mode.emoji} {mode.name}</span>
          <span className="round-counter">Round {Math.min(round, MAX_ROUNDS)} of {continued ? MAX_ROUNDS : MIN_ROUNDS}</span>
        </div>
        <div className="round-pips">
          {Array.from({ length: continued ? MAX_ROUNDS : MIN_ROUNDS }).map((_, i) => (
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

      {/* Input bar — always visible, disabled when waiting for choice or done */}
      {!isDone && (
        <div className="input-bar">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={round === 0 ? 'Loading…' : canSeeVerdict && !continued ? 'Choose an option below…' : `Round ${round + 1} — fire back`}
            disabled={isLoading || isDone || (canSeeVerdict && !continued)}
            rows={2}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isDone || (canSeeVerdict && !continued)}
          >
            →
          </button>
        </div>
      )}

      {/* After min rounds: two buttons */}
      {canSeeVerdict && !continued && !isDone && (
        <div className="round-choice">
          <button
            className="round-choice-btn round-choice-btn--verdict"
            onClick={handleGetVerdict}
            disabled={isGettingVerdict || isLoading}
          >
            {isGettingVerdict ? 'Generating…' : 'See Results →'}
          </button>
          <button
            className="round-choice-btn round-choice-btn--continue"
            onClick={() => setContinued(true)}
            disabled={isLoading}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Hard stop at max rounds */}
      {isDone && (
        <div className="verdict-bar">
          <button
            className="verdict-btn"
            onClick={handleGetVerdict}
            disabled={isGettingVerdict}
          >
            {isGettingVerdict ? 'Generating verdict…' : 'See Results →'}
          </button>
        </div>
      )}
    </div>
  )
}

function DimensionBar({ label, value }) {
  const color = value >= 4 ? '#22c55e' : value >= 3 ? '#f97316' : '#ef4444'
  return (
    <div className="dimension">
      <div className="dimension-header">
        <span className="dimension-label">{label}</span>
        <span className="dimension-value" style={{ color }}>{value}/5</span>
      </div>
      <div className="dimension-track">
        <div className="dimension-fill" style={{ width: `${(value / 5) * 100}%`, background: color }} />
      </div>
    </div>
  )
}

function VerdictScreen({ mode, verdict, onRestart, onHome }) {
  const score = verdict?.score ?? 5
  const scoreColor = score >= 7 ? '#22c55e' : score >= 4 ? '#f97316' : '#ef4444'
  const [copied, setCopied] = useState(false)
  const dims = verdict?.dimensions ?? { viability: 3, evidence: 2, defensibility: 3 }

  const scoreLabel =
    score >= 9 ? 'Exceptional — this idea is battle-hardened' :
    score >= 7 ? 'Strong idea, well defended' :
    score >= 5 ? 'Promising, but gaps remain' :
    score >= 3 ? 'The idea has potential but needs real work' :
    'Significant rethinking needed before moving forward'

  const handleShare = async () => {
    const text = `I scored ${score}/10 on PushBack ${mode.emoji}\n\n"${verdict?.takeaway}"\n\nThink you can do better? → https://pushback-lime.vercel.app`
    if (navigator.share) {
      await navigator.share({ title: 'My PushBack Verdict', text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadPDF = () => {
    const assumptionsList = (verdict?.assumptions ?? []).map((a) => `<li>${a}</li>`).join('')
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>PushBack — ${mode.name} Validation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 620px; margin: 40px auto; padding: 20px; color: #111; line-height: 1.6; }
    h1 { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
    .sub { color: #666; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin: 28px 0 10px; border-top: 1px solid #eee; padding-top: 18px; }
    p, li { font-size: 15px; color: #333; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .footer { margin-top: 48px; font-size: 12px; color: #bbb; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>${mode.emoji} ${mode.name} — Validation Report</h1>
  <p class="sub">PushBack · ${new Date().toLocaleDateString()}</p>
  <h2>🔍 Assumptions You Made</h2>
  <ul>${assumptionsList}</ul>
  <h2>📚 What to Explore</h2>
  <p>${verdict?.resource}</p>
  <div class="footer">Generated by PushBack · pushback-lime.vercel.app</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="verdict-screen" style={{ '--accent': mode.color }}>
      <div className="verdict-content">

        <div className="verdict-top">
          <span className="verdict-mode-label">{mode.emoji} {mode.name}</span>
          <h2 className="verdict-title">What We Found</h2>
        </div>

        {/* Assumptions */}
        <div className="verdict-section">
          <div className="verdict-section-label">🔍 Assumptions You Made</div>
          <ul className="verdict-assumptions">
            {(verdict?.assumptions ?? []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* Resource */}
        <div className="verdict-section verdict-section--highlight">
          <div className="verdict-section-label">📚 What to Explore</div>
          <p className="verdict-section-text">{verdict?.resource}</p>
        </div>

        {/* Actions */}
        <div className="verdict-actions">
          <div className="verdict-actions-row">
            <button className="action-btn action-btn--share" onClick={handleShare}>
              {copied ? '✓ Copied!' : '↗ Share'}
            </button>
            <button className="action-btn action-btn--pdf" onClick={handleDownloadPDF}>
              ↓ Download PDF
            </button>
          </div>
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

  const handleBackToModes = () => {
    setSelectedMode(null)
    setScreen('modes')
  }

  return (
    <div className="app">
      {screen === 'home' && <LandingPage onSelectMode={handleSelectMode} />}
      {screen === 'modes' && (
        <ModeSelectScreen onSelectMode={handleSelectMode} onBack={handleHome} />
      )}
      {screen === 'mode' && (
        <ModeScreen mode={selectedMode} onStart={handleStart} onBack={handleBackToModes} />
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
          onHome={() => setScreen('modes')}
        />
      )}
    </div>
  )
}
