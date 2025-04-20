import Fastify from 'fastify'
import cron from 'node-cron'
import dotenv from 'dotenv'

dotenv.config()

const timeout = process.env.MAX_PROVIDER_TIMEOUT
const port = process.env.PORT || 3000
const host = process.env.HOST || '127.0.0.1'
const cronF =  '*/5 * * * * *' || 30000

const fastify = Fastify()

let providers = []

fastify.post('/', async (request, reply) => {
  const ip = request.ip
  const existing = providers.find(p => p.ip === ip)
  const now = Date.now()

  console.log({ ip, lastSeen: now })

  if (existing) {
    existing.lastSeen = now
  } else {
    providers.push({ ip, lastSeen: now })
  }

  reply.send({ status: 'ok' })
})

fastify.get('/', async (_, reply) => {
  if (providers.length === 0) {
    return reply.code(503).send({ error: 'No available providers' })
  }

  reply.send({ ip: providers[0].ip })
})

cron.schedule(cronF, async () => {
  const now = Date.now()

  if (now - providers[0].lastSeen > timeout) {
    providers = providers.filter(p => now - p.lastSeen < timeout)
    if (providers && providers[0]) {
      // avisar cambio de provider
    } else {
      // avisar que no hay providers
    }
  }
})

fastify.listen({ port, host }, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Listening! on port: ${port}, ip: ${host}`)
})
