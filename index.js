import Fastify from 'fastify'
import cron from 'node-cron'
import dotenv from 'dotenv'

dotenv.config()

const timeout = process.env.MAX_TIMEOUT
const port = process.env.PORT
const cronF =  '*/20 * * * * *'

const fastify = Fastify()

let providers = []

fastify.post('/', async (request, reply) => {
  const ip = request.ip
  const existing = providers.find(p => p.ip === ip)
  const now = Date.now()

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
  console.log(`providers:`)
  providers.forEach(p => {
    console.log('starts')
    Object.keys(p).forEach(v => console.log(p[v]))
  })
  const now = Date.now()
  const before = providers.length
  providers = providers.filter(p => now - p.lastSeen < timeout)

  const after = providers.length
  if (before !== after) {
    console.log(`Removed ${before - after} inactive providers`)
    // missing
  }
})

fastify.listen({ port }, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Listening! port: ${port}`)
})
