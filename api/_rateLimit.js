import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const DAILY_LIMIT = 15 // ~3 full debates (5 rounds each)

export function getIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  return forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress ?? 'unknown'
}

export async function isRateLimited(ip) {
  const today = new Date().toISOString().split('T')[0]
  const key = `rate:${ip}:${today}`

  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 86400)
  }

  return count > DAILY_LIMIT
}
