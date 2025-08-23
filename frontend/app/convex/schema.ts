import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  flows: defineTable({
    flowData: v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      paradigm: v.union(v.literal("Agentic"), v.literal("Sequential")),
      nodes: v.array(v.any()),
      edges: v.array(v.any()),
      version: v.string(),
      created: v.optional(v.string()),
      updated: v.optional(v.string()),
      metadata: v.optional(v.any()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_flow_id", ["flowData.id"]),
});