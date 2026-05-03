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
      max_tokens: 1200,
      system: `You are an impartial debate judge and coach. Analyze the full conversation and return ONLY a valid JSON object — no markdown, no extra text — with these exact keys:
{
  "score": <integer 1-10, overall argument strength>,
  "strongestMoment": "<one sentence: the user's single strongest argument>",
  "biggestGap": "<one sentence: the user's most significant weakness>",
  "takeaway": "<one sentence: the most important thing to reflect on>",
  "dimensions": {
    "viability": <integer 1-5, how viable the core idea actually is based on the conversation>,
    "evidence": <integer 1-5, how well they supported their claims with real data or reasoning>,
    "defensibility": <integer 1-5, how well they defended against challenges and adapted>
  },
  "assumptions": [
    "<MUST reference something specific the user actually said. Format exactly like this: 'When you said \"[direct quote or close paraphrase]\", you assumed [specific hidden belief] — but you never proved it.' Generic assumptions like 'you assumed your position is correct' are not acceptable.>",
    "<Another specific moment from the conversation. Same format. Must be grounded in what they actually wrote, not a generic pattern.>",
    "<A third specific assumption tied to a specific thing they said. If the user only made 2 clear assumptions, restate the most critical one with a different angle.>"
  ],
  "reframe": "<2-3 sentences: how the user could have argued their position more effectively — be specific and constructive>",
  "resource": "<one concept, question, or area of thinking the user should explore to strengthen this kind of argument — be specific, not generic>"
}`,
      messages: [
        ...messages,
        { role: 'user', content: 'Give me the full verdict and coaching breakdown on my performance.' },
      ],
    })

    const verdict = JSON.parse(response.content[0].text.trim())
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
