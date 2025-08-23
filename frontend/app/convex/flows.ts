import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createFlow = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existingFlow = await ctx.db
      .query("flows")
      .withIndex("by_flow_id", (q) => q.eq("flowData.id", args.flowData.id))
      .first();

    const now = Date.now();
    
    if (existingFlow) {
      await ctx.db.patch(existingFlow._id, {
        flowData: {
          ...args.flowData,
          updated: new Date(now).toISOString(),
        },
        updatedAt: now,
      });
      return { flowId: args.flowData.id, _id: existingFlow._id };
    } else {
      const flowToStore = {
        ...args.flowData,
        created: args.flowData.created || new Date(now).toISOString(),
        updated: new Date(now).toISOString(),
      };
      
      const docId = await ctx.db.insert("flows", {
        flowData: flowToStore,
        createdAt: now,
        updatedAt: now,
      });
      
      return { flowId: args.flowData.id, _id: docId };
    }
  },
});

export const getFlow = query({
  args: { 
    flowId: v.string() 
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db
      .query("flows")
      .withIndex("by_flow_id", (q) => q.eq("flowData.id", args.flowId))
      .first();
    
    if (!flow) {
      return null;
    }
    
    return flow.flowData;
  },
});

export const getFlowById = query({
  args: { 
    id: v.id("flows") 
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.id);
    return flow ? flow.flowData : null;
  },
});

export const listFlows = query({
  args: {},
  handler: async (ctx) => {
    const flows = await ctx.db
      .query("flows")
      .order("desc")
      .take(100);
    
    return flows.map(flow => ({
      _id: flow._id,
      ...flow.flowData,
    }));
  },
});

export const deleteFlow = mutation({
  args: { 
    flowId: v.string() 
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db
      .query("flows")
      .withIndex("by_flow_id", (q) => q.eq("flowData.id", args.flowId))
      .first();
    
    if (flow) {
      await ctx.db.delete(flow._id);
      return { success: true, flowId: args.flowId };
    }
    
    return { success: false, flowId: args.flowId, error: "Flow not found" };
  },
});