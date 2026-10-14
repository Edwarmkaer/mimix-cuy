import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { normalizeAlias, validateRunResult } from '../game/score-rules.js'

const submitResult = v.object({ saved: v.literal(true), duplicate: v.boolean(), newBest: v.boolean(), bestScore: v.number() })
const publicRow = v.object({ alias: v.string(), score: v.number(), coins: v.number(), createdAt: v.number() })

// Guest submissions are intentionally public and append-only. Aliases are public
// labels, not authenticated identities. No player records can be read or edited.
export const submit = mutation({
  args: {
    runId: v.string(), alias: v.string(), score: v.number(), coins: v.number(),
    durationSeconds: v.number(), mode: v.union(v.literal('camera'), v.literal('keyboard')),
  },
  returns: submitResult,
  handler: async (ctx, args) => {
    let name: ReturnType<typeof normalizeAlias>
    try {
      name = normalizeAlias(args.alias)
      validateRunResult(args)
    } catch (error) {
      throw new ConvexError({ message: error instanceof Error ? error.message : 'Resultado no válido.' })
    }
    const existing = await ctx.db.query('runs').withIndex('by_runId', q => q.eq('runId', args.runId)).unique()
    const best = await ctx.db.query('bestScores').withIndex('by_aliasKey', q => q.eq('aliasKey', name.aliasKey)).unique()
    if (existing) {
      if (existing.aliasKey !== name.aliasKey || existing.score !== args.score || existing.coins !== args.coins || existing.durationSeconds !== args.durationSeconds || existing.mode !== args.mode) {
        throw new ConvexError({ message: 'Esta partida ya fue guardada con otro resultado o alias.' })
      }
      return { saved: true as const, duplicate: true, newBest: false, bestScore: best?.score ?? existing.score }
    }
    const row = { ...name, score: args.score, coins: args.coins, durationSeconds: args.durationSeconds, mode: args.mode, createdAt: Date.now() }
    await ctx.db.insert('runs', { ...row, runId: args.runId })
    const newBest = !best || args.score > best.score || (args.score === best.score && args.coins > best.coins)
    if (newBest) {
      if (best) await ctx.db.patch(best._id, row)
      else await ctx.db.insert('bestScores', row)
    }
    return { saved: true as const, duplicate: false, newBest, bestScore: newBest ? args.score : best!.score }
  },
})

export const top = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(publicRow),
  handler: async (ctx, { limit = 10 }) => {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw new ConvexError({ message: 'El límite del ranking debe estar entre 1 y 50.' })
    const rows = await ctx.db.query('bestScores').withIndex('by_score_and_coins').order('desc').take(limit)
    return rows.map(({ alias, score, coins, createdAt }) => ({ alias, score, coins, createdAt }))
  },
})
