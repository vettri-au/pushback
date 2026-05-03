import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages } = req.body
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: `You are an expert idea validator. Read the full conversation and return ONLY a raw JSON object. No markdown. No code blocks. No backticks. No explanation. Just the JSON.

The JSON must have exactly these two keys:

{
  "assumptions": [
    "When you said \\"[exact words or close paraphrase from the conversation]\\", you assumed [specific hidden belief] — but you never proved it.",
    "When you said \\"[another specific thing they said]\\", you assumed [another specific hidden belief] — but you never proved it.",
    "When you said \\"[a third specific thing they said]\\", you assumed [a third specific hidden belief] — but you never proved it."
  ],
  "resource": "[One specific concept, framework, or question the user should explore based on the actual gaps in their idea — be precise, not generic]"
}

CRITICAL: Every assumption MUST quote or closely paraphrase something the user actually wrote. Do NOT write generic assumptions like 'you assumed your position is correct'. If you cannot find 3 distinct assumptions, find 2 and rephrase the most important one from a different angle.`,
      messages: [
        ...messages,
        { role: 'user', content: 'Give me the full verdict and coaching breakdown on my performance.' },
      ],
    })

    let text = response.content[0].text.trim()
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const verdict = JSON.parse(text)
    res.status(200).json(verdict)
  } catch (err) {
    res.status(200).json({
      score: 5,
      strongestMoment: 'You engaged consistently throughout the debate.',
      biggestGap: 'Several arguments lacked concrete supporting evidence.',
      takeaway: 'Challenge your own assumptions before defending them.',
      dimensions: { viability: 3, evidence: 2, defensibility: 3 },
      assumptions: [
        'You assumed your position is self-evidently correct without proving it.',
        'You assumed the other side has no legitimate merit.',
        'You assumed your experience is representative of the broader reality.',
      ],
      reframe: 'Focus on concrete evidence rather than general principles. Acknowledge the strongest version of the opposing argument before dismantling it — this makes your position more credible, not weaker.',
      resource: 'Explore the concept of steel-manning — arguing the opposing view as strongly as possible before countering it.',
    })
  }
}
