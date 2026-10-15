import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

let server, origin
before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { host: '127.0.0.1', port: 0, strictPort: false, watch: null },
    logLevel: 'error',
  })
  await server.listen()
  origin = `http://127.0.0.1:${server.httpServer.address().port}`
})
after(async () => { await server?.close() })

test('root and legacy page links redirect to the short routes while retaining query parameters', async () => {
  for (const [source, destination] of [
    ['/?from=event', '/home?from=event'],
    ['/index.html', '/home'],
    ['/home/', '/home'],
    ['/game/', '/game'],
    ['/experiences/floor-is-lava', '/game'],
    ['/experiences/floor-is-lava/', '/game'],
    ['/experiences/floor-is-lava/index.html?mode=keyboard', '/game?mode=keyboard'],
  ]) {
    const response = await fetch(origin + source, { redirect: 'manual' })
    assert.equal(response.status, 308, source)
    assert.equal(response.headers.get('location'), destination, source)
  }
})

test('home and game serve their distinct pages on direct navigation', async () => {
  const home = await fetch(origin + '/home')
  assert.equal(home.status, 200)
  assert.match(await home.text(), /<div id="root"><\/div>/)
  const game = await fetch(origin + '/game')
  assert.equal(game.status, 200)
  const html = await game.text()
  assert.match(html, /id="renderDiv"/)
  assert.match(html, /href="\/home"/)
})

test('game-relative resources resolve and load from the clean game URL', async () => {
  const html = await (await fetch(origin + '/game')).text()
  const base = /<base\s+href="([^"]+)"/.exec(html)?.[1]
  assert.ok(base, 'the standalone game needs an explicit resource base')
  const documentBase = new URL(base, origin + '/game')
  for (const resource of ['styles.css', 'main.js', 'assets/road.glb', 'score-service.js']) {
    const response = await fetch(new URL(resource, documentBase))
    assert.equal(response.status, 200, resource)
    assert.doesNotMatch(response.headers.get('content-type'), /text\/html/, resource)
    await response.arrayBuffer()
  }
})
