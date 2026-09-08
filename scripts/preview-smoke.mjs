import { spawn } from 'node:child_process'
import process from 'node:process'

const port = 4321
const host = '127.0.0.1'
const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
})
let output = ''
server.stdout.on('data', (chunk) => { output += chunk.toString() })
server.stderr.on('data', (chunk) => { output += chunk.toString() })

const stop = () => { if (!server.killed) server.kill('SIGTERM') }
process.on('exit', stop)
process.on('SIGINT', () => { stop(); process.exit(130) })
const finish = (code) => { stop(); process.exit(code) }

const routes = ['/', '/docs', '/docs/2.x/', '/docs/2.x/installation', '/docs/2.x/concepts', '/docs/2.x/actions', '/docs/2.x/filters', '/docs/2.x/collectors', '/docs/2.x/processors', '/docs/2.x/renderers', '/docs/2.x/laravel', '/docs/2.x/upgrade', '/docs/2.x/api']
let ready = false
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const response = await fetch(`http://${host}:${port}/`)
    if (response.ok) { ready = true; break }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 250))
}
if (!ready) {
  console.error(`Preview server did not become ready.\n${output}`)
  finish(1)
}

for (const route of routes) {
  const response = await fetch(`http://${host}:${port}${route}`)
  if (!response.ok) {
    console.error(`Preview smoke test failed: ${route} returned HTTP ${response.status}`)
    process.exitCode = 1
  }
}
if (process.exitCode) process.exit()
console.log(`Preview smoke test passed: ${routes.length} routes returned HTTP 2xx.`)
finish(0)
