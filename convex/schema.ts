import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const resultFields = {
  alias: v.string(), aliasKey: v.string(), score: v.number(), coins: v.number(),
  durationSeconds: v.number(), mode: v.union(v.literal('camera'), v.literal('keyboard')), createdAt: v.number(),
}

export default defineSchema({
  runs: defineTable({ ...resultFields, runId: v.string() }).index('by_runId', ['runId']),
  bestScores: defineTable(resultFields)
    .index('by_aliasKey', ['aliasKey'])
    .index('by_score_and_coins', ['score', 'coins']),
})
