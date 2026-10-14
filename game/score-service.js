import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { CONVEX_URL } from './ranking-config.js'
import { normalizeAlias, validateRunResult } from './score-rules.js'

const keys = { best: 'mimix-best-run-v1', alias: 'mimix-ranking-alias-v1', pending: 'mimix-pending-run-v1' }
let client

function read(key) {
  try { return JSON.parse(globalThis.localStorage?.getItem(key) ?? 'null') } catch { return null }
}
function write(key, value) {
  try { globalThis.localStorage?.setItem(key, JSON.stringify(value)) } catch { /* Storage is optional. */ }
}
function remove(key) {
  try { globalThis.localStorage?.removeItem(key) } catch { /* Storage is optional. */ }
}

export function getLocalBest() {
  const value = read(keys.best)
  if (!value || !Number.isSafeInteger(value.score) || value.score < 0 || !Number.isSafeInteger(value.coins) || value.coins < 0) return { score: 0, coins: 0 }
  return { score: value.score, coins: value.coins }
}

export function recordLocalResult({ score, coins, durationSeconds, mode }) {
  const result = Object.freeze(validateRunResult({ runId: crypto.randomUUID(), score: Math.floor(score), coins, durationSeconds: Math.round(durationSeconds * 1000) / 1000, mode }))
  const best = getLocalBest()
  if (result.score > best.score || (result.score === best.score && result.coins > best.coins)) write(keys.best, result)
  return result
}

export function getRememberedAlias() {
  try { return normalizeAlias(read(keys.alias)).alias } catch { return '' }
}

export function getPendingResult() {
  const pending = read(keys.pending)
  if (!pending) return null
  try { return { ...validateRunResult(pending), alias: normalizeAlias(pending.alias).alias } } catch { return null }
}

export function isRankingAvailable() {
  try {
    const url = new URL(CONVEX_URL)
    return url.protocol === 'https:' && url.hostname.endsWith('.convex.cloud') && url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash
  } catch { return false }
}

function remote() {
  if (!isRankingAvailable()) throw new Error('El ranking aún no está disponible. Tu récord sigue guardado en este navegador.')
  return client ??= new ConvexHttpClient(CONVEX_URL)
}
function networkError(error) {
  if (error?.data && typeof error.data.message === 'string') return new Error(error.data.message)
  return new Error('No pudimos guardar o cargar el ranking. Revisa tu conexión y vuelve a intentar.')
}

export async function saveResult(input) {
  const result = validateRunResult(input)
  const { alias } = normalizeAlias(input.alias)
  const payload = { ...result, alias }
  write(keys.alias, alias)
  write(keys.pending, payload)
  const connection = remote()
  try {
    const saved = await connection.mutation(makeFunctionReference('leaderboard:submit'), payload)
    if (read(keys.pending)?.runId === result.runId) remove(keys.pending)
    return saved
  } catch (error) { throw networkError(error) }
}

export async function loadLeaderboard({ limit = 10 } = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw new Error('El límite del ranking debe estar entre 1 y 50.')
  const connection = remote()
  try { return await connection.query(makeFunctionReference('leaderboard:top'), { limit }) } catch (error) { throw networkError(error) }
}
