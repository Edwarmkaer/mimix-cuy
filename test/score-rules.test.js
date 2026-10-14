import test from 'node:test'
import assert from 'node:assert/strict'

const rules = () => import('../game/score-rules.js')
const result = { runId: '6d8f706f-bb40-4f71-9bd4-991286e530b4', score: 170, coins: 5, durationSeconds: 10, mode: 'keyboard' }

test('aliases support Spanish names, collapse spacing and compare without case', async () => {
  const { normalizeAlias } = await rules()
  assert.deepEqual(normalizeAlias('  Ñaño   Cuy  '), { alias: 'Ñaño Cuy', aliasKey: 'ñaño cuy' })
  for (const alias of ['ab', 'x'.repeat(21), '<script>', 'a\u0000bc']) assert.throws(() => normalizeAlias(alias))
})

test('run results validate finite values and preserve the same ID for retries', async () => {
  const { validateRunResult } = await rules()
  assert.deepEqual(validateRunResult(result), result)
  for (const change of [{ score: NaN }, { score: -1 }, { score: 1.1 }, { coins: Infinity }, { coins: -1 }, { durationSeconds: -1 }, { mode: 'robot' }, { runId: 'same' }]) {
    assert.throws(() => validateRunResult({ ...result, ...change }))
  }
})

test('submitted points must agree with survival time and collected coins', async () => {
  const { validateRunResult } = await rules()
  assert.throws(() => validateRunResult({ ...result, score: 999999 }))
  assert.throws(() => validateRunResult({ ...result, score: 1 }))
  assert.throws(() => validateRunResult({ ...result, coins: 10000, score: 100100 }))
  assert.equal(validateRunResult({ ...result, score: 150 }).score, 150)
  assert.equal(validateRunResult({ ...result, score: 300 }).score, 300)
})
