import { useQuery } from "@tanstack/react-query";
import { nocobaseClient } from "@nocobase/portal-sdk/client";

export type AggregateRow = Record<string, string | number | null>;

const sumAmount = { field: ["amount"], aggregation: "sum", alias: "amount" };
const countId = { field: ["id"], aggregation: "count", alias: "count" };

export function useWonByOwner(month: string) {
  const start = `${month}-01`;
  const end = new Date(`${month}-01T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  const endIso = end.toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["crm", "won-by-owner", month],
    queryFn: () => nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
      body: {
        measures: [
          { field: ["amount"], aggregation: "sum", alias: "won_amount" },
          { field: ["id"], aggregation: "count", alias: "deal_count" },
        ],
        dimensions: [
          { field: ["ownerId"], alias: "owner_id" },
          { field: ["owner", "nickname"], alias: "owner_name" },
        ],
        filter: { stage: "won", closed_date: { $between: [start, endIso] } },
      },
    }),
  });
}

export function useReportAnalytics() {
  return useQuery({
    queryKey: ["crm", "report-analytics"],
    queryFn: async () => {
      const [pipeline, wonByDay, wonLoss, activity, topAccounts, byStage] = await Promise.all([
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumAmount, countId],
            dimensions: [
              { field: ["stage"], alias: "stage" },
              { field: ["owner", "nickname"], alias: "owner_name" },
            ],
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumAmount, countId],
            dimensions: [{ field: ["closed_date"], alias: "closed_date" }],
            // A date `$notNull` filter is interpreted by the server as the
            // current date in aggregate queries. Won deals already carry a
            // close date, so filtering by stage preserves the full history.
            filter: { stage: "won" },
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumAmount, countId],
            dimensions: [{ field: ["stage"], alias: "stage" }],
            filter: { stage: { $in: ["won", "lost"] } },
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_activities", "query", {
          body: {
            measures: [{ field: ["id"], aggregation: "count", alias: "count" }],
            dimensions: [{ field: ["type"], alias: "type" }],
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumAmount, countId],
            dimensions: [
              { field: ["customer_id"], alias: "customer_id" },
              { field: ["customer", "company_name"], alias: "customer_name" },
            ],
            orders: [{ field: ["amount"], alias: "amount", order: "desc" }],
            limit: 8,
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumAmount, countId],
            dimensions: [{ field: ["stage"], alias: "stage" }],
          },
        }),
      ]);
      const monthly = new Map<string, { month: string; amount: number; count: number }>();
      for (const row of wonByDay ?? []) {
        const month = String(row.closed_date ?? "").slice(0, 7);
        if (!month) continue;
        const current = monthly.get(month) ?? { month, amount: 0, count: 0 };
        current.amount += Number(row.amount ?? 0);
        current.count += Number(row.count ?? 0);
        monthly.set(month, current);
      }
      return {
        pipeline: pipeline ?? [],
        monthly: [...monthly.values()].sort((left, right) => left.month.localeCompare(right.month)),
        wonLoss: wonLoss ?? [],
        activity: activity ?? [],
        topAccounts: topAccounts ?? [],
        byStage: byStage ?? [],
      };
    },
  });
}
