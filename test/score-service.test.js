import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const service = () => import('../game/score-service.js')
beforeEach(() => {
  const values = new Map()
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
})

test('keeps the best local run with its own coins instead of adding every run', async () => {
  const { recordLocalResult, getLocalBest } = await service()
  const one = recordLocalResult({ score: 170, coins: 5, durationSeconds: 10, mode: 'keyboard' })
  const two = recordLocalResult({ score: 150, coins: 3, durationSeconds: 10, mode: 'keyboard' })
  assert.notEqual(one.runId, two.runId)
  assert.equal(Object.isFrozen(one), true)
  assert.deepEqual(getLocalBest(), { score: 170, coins: 5 })
})

test('a disabled remote ranking does not stop recording and stores the attempt for retry', async () => {
  const { recordLocalResult, getPendingResult, saveResult, getRememberedAlias } = await service()
  const run = recordLocalResult({ score: 150, coins: 5, durationSeconds: 10, mode: 'keyboard' })
  await assert.rejects(saveResult({ ...run, alias: 'Cuy Feliz' }), /ranking/i)
  assert.equal(getPendingResult().runId, run.runId)
  assert.equal(getPendingResult().alias, 'Cuy Feliz')
  assert.equal(getRememberedAlias(), 'Cuy Feliz')
})

test('blocked or corrupted local storage leaves the game usable', async () => {
  const { recordLocalResult, getLocalBest } = await service()
  globalThis.localStorage = { getItem: () => '{invalid', setItem: () => { throw new Error('blocked') } }
  assert.deepEqual(getLocalBest(), { score: 0, coins: 0 })
  assert.equal(recordLocalResult({ score: 100, coins: 0, durationSeconds: 10, mode: 'camera' }).score, 100)
})
