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
      max_tokens: 400,
      system: `You are an impartial debate judge. Analyze the full conversation and return ONLY a JSON object — no markdown, no extra text — with these exact keys:
{
  "score": <integer 1-10 rating the user's argument strength>,
  "strongestMoment": "<one sentence: the user's single strongest argument>",
  "biggestGap": "<one sentence: the user's most significant logical gap or weakness>",
  "takeaway": "<one sentence: the most important thing the user should reflect on>"
}`,
      messages: [
        ...messages,
        { role: 'user', content: 'Give me the verdict on my performance.' },
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
    })
  }
}
