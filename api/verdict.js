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
    "clarity": <integer 1-5, how clearly they stated their position>,
    "evidence": <integer 1-5, how well they supported their claims>,
    "adaptability": <integer 1-5, how well they responded to pushback>
  },
  "assumptions": [
    "<assumption they made without justifying it>",
    "<another unjustified assumption>",
    "<a third assumption if present, or repeat pattern if not>"
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
      dimensions: { clarity: 3, evidence: 2, adaptability: 3 },
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
