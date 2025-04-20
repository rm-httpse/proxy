import Fastify from 'fastify'
import cron from 'node-cron'

const cronF =  '*/10 * * * * *'
const timeout = 30_000

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

fastify.listen({ port: 3000 }, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Fastify proxy manager listening on port 3000')
})
