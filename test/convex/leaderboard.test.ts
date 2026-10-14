import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'

const modules = import.meta.glob(['../../convex/**/*.ts', '../../convex/**/*.js', '!../../convex/**/*.d.ts'])
const sample = { runId: '6d8f706f-bb40-4f71-9bd4-991286e530b4', alias: 'Cuy Feliz', score: 170, coins: 5, durationSeconds: 10, mode: 'keyboard' as const }
async function backend() {
  const { default: schema } = await import('../../convex/schema')
  const { api } = await import('../../convex/_generated/api')
  return { t: convexTest(schema, modules), api }
}

describe('guest event ranking', () => {
  test('stores a real run and retrying the same run does not add another record', async () => {
    const { t, api } = await backend()
    expect(await t.mutation(api.leaderboard.submit, sample)).toEqual({ saved: true, duplicate: false, newBest: true, bestScore: 170 })
    expect(await t.mutation(api.leaderboard.submit, sample)).toEqual({ saved: true, duplicate: true, newBest: false, bestScore: 170 })
    const runs = await t.run(ctx => ctx.db.query('runs').take(10))
    expect(runs).toHaveLength(1)
    const rows = await t.query(api.leaderboard.top, { limit: 10 })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ alias: 'Cuy Feliz', score: 170, coins: 5 })
    expect(Object.keys(rows[0]).sort()).toEqual(['alias', 'coins', 'createdAt', 'score'])
  })

  test('keeps the best score per normalized alias and never accumulates coins', async () => {
    const { t, api } = await backend()
    await t.mutation(api.leaderboard.submit, sample)
    const second = { ...sample, runId: '0b963972-ec70-468b-b4ae-26c2e033e3f0', alias: '  cuy  feliz ', score: 150 }
    expect(await t.mutation(api.leaderboard.submit, second)).toMatchObject({ newBest: false, bestScore: 170 })
    const third = { ...sample, runId: 'fda62b9a-e5ed-4adb-a8d9-d837714f3bf5', score: 200, coins: 6 }
    expect(await t.mutation(api.leaderboard.submit, third)).toMatchObject({ newBest: true, bestScore: 200 })
    const rows = await t.query(api.leaderboard.top, { limit: 10 })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ score: 200, coins: 6 })
  })

  test('rejects changed retries, invalid aliases and impossible results', async () => {
    const { t, api } = await backend()
    await t.mutation(api.leaderboard.submit, sample)
    await expect(t.mutation(api.leaderboard.submit, { ...sample, alias: 'Otro Cuy' })).rejects.toThrow()
    await expect(t.mutation(api.leaderboard.submit, { ...sample, runId: 'fda62b9a-e5ed-4adb-a8d9-d837714f3bf5', score: 999999 })).rejects.toThrow()
    await expect(t.mutation(api.leaderboard.submit, { ...sample, alias: '<script>' })).rejects.toThrow()
    await expect(t.query(api.leaderboard.top, { limit: 10000 })).rejects.toThrow()
  })

  test('sorts the top scores and bounds the number of returned participants', async () => {
    const { t, api } = await backend()
    for (let i = 0; i < 12; i++) await t.mutation(api.leaderboard.submit, {
      ...sample, runId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, alias: `Jugador ${i}`, score: 150 + i,
    })
    const rows = await t.query(api.leaderboard.top, { limit: 10 })
    expect(rows).toHaveLength(10)
    expect(rows.map(row => row.score)).toEqual([161,160,159,158,157,156,155,154,153,152])
  })
})
