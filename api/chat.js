import Anthropic from '@anthropic-ai/sdk'
import { getIP, isRateLimited } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getIP(req)
  if (await isRateLimited(ip)) {
    return res.status(429).json({ error: 'Daily limit reached. Come back tomorrow.' })
  }

  try {
    const { messages, systemPrompt } = req.body
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 600,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    })
    res.status(200).json({ content: response.content[0].text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
