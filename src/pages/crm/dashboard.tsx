import { useList, useTranslate } from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import ReactECharts from "echarts-for-react";
import { Outlet } from "react-router";
import { LoadingState } from "@/components/app-shell/loading-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme/theme-provider";
import { nocobaseClient } from "@nocobase/portal-sdk/client";
import {
  DEAL_STAGES,
  FOLLOW_UP_STATUSES,
  OPEN_DEAL_STAGES,
  formatCurrency,
  formatDate,
  labelFor,
} from "./constants";
import { useOpenContextualChild } from "./route-surfaces";
import { EnumBadge, useLocale } from "./shared";
import type { CustomerRecord, DealRecord, FollowUpRecord } from "./types";

type AggregateRow = Record<string, string | number | null>;

// Blue-forward palette shared across the CRM / IT / Helpdesk portals.
const CHART_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const sumMeasure = { field: ["amount"], aggregation: "sum", alias: "total" };
const countMeasure = { field: ["id"], aggregation: "count", alias: "count" };

function usePipelineSummary() {
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const soon = format(addDays(new Date(), 30), "yyyy-MM-dd");
  const today = todayIso();

  return useQuery({
    queryKey: ["crm", "pipeline-summary", monthStart, soon],
    queryFn: async () => {
      const openFilter = { stage: { $in: OPEN_DEAL_STAGES } };
      const [open, closingSoon, wonThisMonth, byStage] = await Promise.all([
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumMeasure, countMeasure],
            filter: openFilter,
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumMeasure, countMeasure],
            filter: {
              ...openFilter,
              expected_close_date: { $between: [today, soon] },
            },
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumMeasure, countMeasure],
            filter: {
              stage: "won",
              closed_date: { $between: [monthStart, monthEnd] },
            },
          },
        }),
        nocobaseClient.action<AggregateRow[]>("crm_deals", "query", {
          body: {
            measures: [sumMeasure, countMeasure],
            dimensions: [{ field: ["stage"], alias: "stage" }],
          },
        }),
      ]);
      return {
        open: open[0] ?? {},
        closingSoon: closingSoon[0] ?? {},
        wonThisMonth: wonThisMonth[0] ?? {},
        byStage: byStage ?? [],
      };
    },
  });
}

function useDormantAccounts() {
  return useQuery({
    queryKey: ["crm", "dormant-accounts"],
    queryFn: async () => {
      const [lastTouch, customers] = await Promise.all([
        nocobaseClient.action<AggregateRow[]>("crm_activities", "query", {
          body: {
            measures: [{ field: ["date"], aggregation: "max", alias: "last_date" }],
            dimensions: [{ field: ["customer_id"], alias: "customer_id" }],
          },
        }),
        nocobaseClient.action<CustomerRecord[]>("crm_customers", "list", {
          query: { page: 1, pageSize: 250, sort: "company_name" },
        }),
      ]);
      const lastTouchByCustomer = new Map<string, string>();
      for (const row of lastTouch ?? []) {
        const customerId = row.customer_id;
        const lastDate = row.last_date;
        if (customerId !== null && customerId !== undefined && lastDate) {
          lastTouchByCustomer.set(String(customerId), String(lastDate));
        }
      }
      const cutoff = addDays(new Date(), -30);
      const dormant = customers
        .filter((customer) => (customer.status ?? "active") === "active")
        .map((customer) => ({
          customer,
          lastDate: lastTouchByCustomer.get(String(customer.id)) ?? null,
        }))
        .filter(
          ({ lastDate }) =>
            lastDate === null || new Date(lastDate).getTime() < cutoff.getTime()
        )
        .sort((left, right) =>
          (left.lastDate ?? "").localeCompare(right.lastDate ?? "")
        )
        .slice(0, 8);
      return { dormant, total: dormant.length };
    },
  });
}

export function DashboardPage() {
  const translate = useTranslate();
  const locale = useLocale();
  const openChild = useOpenContextualChild();
  const summary = usePipelineSummary();
  const dormant = useDormantAccounts();

  const soon = format(addDays(new Date(), 30), "yyyy-MM-dd");
  const closingSoon = useList<DealRecord>({
    resource: "crm_deals",
    pagination: { mode: "server", currentPage: 1, pageSize: 8 },
    sorters: [{ field: "expected_close_date", order: "asc" }],
    filters: [
      { field: "stage", operator: "in", value: OPEN_DEAL_STAGES },
      { field: "expected_close_date", operator: "lte", value: soon },
    ],
    meta: { appends: ["customer"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const nextFollowUps = useList<FollowUpRecord>({
    resource: "crm_follow_ups",
    pagination: { mode: "server", currentPage: 1, pageSize: 5 },
    sorters: [{ field: "due_date", order: "asc" }],
    filters: [{ field: "status", operator: "eq", value: "pending" }],
    meta: { appends: ["customer"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const openTotal = Number(summary.data?.open?.total ?? 0);
  const openCount = Number(summary.data?.open?.count ?? 0);
  const soonTotal = Number(summary.data?.closingSoon?.total ?? 0);
  const soonCount = Number(summary.data?.closingSoon?.count ?? 0);
  const wonTotal = Number(summary.data?.wonThisMonth?.total ?? 0);
  const wonCount = Number(summary.data?.wonThisMonth?.count ?? 0);
  const dormantTotal = dormant.data?.total ?? 0;

  const byStage = DEAL_STAGES.map((stage) => {
    const row = summary.data?.byStage.find(
      (item) => item.stage === stage.value
    );
    return {
      ...stage,
      label: labelFor(DEAL_STAGES, stage.value, translate),
      total: Number(row?.total ?? 0),
      count: Number(row?.count ?? 0),
    };
  });

  // ECharts renders to canvas and cannot resolve CSS custom properties, so we
  // pass concrete theme-aware colors instead of var(--...) (which rendered black).
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const gridColor = theme === "dark" ? "rgba(148, 163, 184, 0.18)" : "#e5e7eb";

  const chartOption = {
    grid: { left: 8, right: 8, top: 16, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category",
      data: byStage.map((stage) => stage.label),
      axisLine: { lineStyle: { color: gridColor } },
      axisTick: { show: false },
      axisLabel: { color: axisColor },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: axisColor },
      splitLine: { lineStyle: { color: gridColor } },
    },
    series: [
      {
        type: "bar",
        barWidth: "45%",
        data: byStage.map((stage, index) => ({
          value: stage.total,
          itemStyle: {
            color: CHART_COLORS[index % CHART_COLORS.length],
            borderRadius: [6, 6, 0, 0],
          },
        })),
      },
    ],
  };

  const today = todayIso();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-[-0.035em]">
          {translate("crm.dashboard.title", { ns: "starter" }, "Dashboard")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {translate(
            "crm.dashboard.description",
            { ns: "starter" },
            "This month's pipeline, what's likely to close, and accounts that need attention."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          loading={summary.isLoading}
          label={translate("crm.dashboard.openPipeline", { ns: "starter" }, "Open pipeline")}
          value={formatCurrency(openTotal, locale)}
          sub={translate(
            "crm.dashboard.openPipeline.sub",
            { ns: "starter", count: openCount },
            `${openCount} active deals`
          )}
        />
        <KpiCard
          loading={summary.isLoading}
          label={translate("crm.dashboard.closingSoon", { ns: "starter" }, "Expected to close (30 days)")}
          value={formatCurrency(soonTotal, locale)}
          sub={translate(
            "crm.dashboard.closingSoon.sub",
            { ns: "starter", count: soonCount },
            `${soonCount} deals with dates set`
          )}
        />
        <KpiCard
          loading={summary.isLoading}
          label={translate("crm.dashboard.wonThisMonth", { ns: "starter" }, "Won this month")}
          value={formatCurrency(wonTotal, locale)}
          sub={translate(
            "crm.dashboard.wonThisMonth.sub",
            { ns: "starter", count: wonCount },
            `${wonCount} deals closed won`
          )}
        />
        <KpiCard
          loading={dormant.isLoading}
          label={translate("crm.dashboard.dormant", { ns: "starter" }, "Untouched 30+ days")}
          value={String(dormantTotal)}
          sub={translate(
            "crm.dashboard.dormant.sub",
            { ns: "starter" },
            "Active accounts with no activity"
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {translate("crm.dashboard.byStage.title", { ns: "starter" }, "Pipeline by stage")}
            </CardTitle>
            <CardDescription>
              {translate(
                "crm.dashboard.byStage.description",
                { ns: "starter" },
                "Total deal value in each stage."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ReactECharts option={chartOption} style={{ height: 256 }} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {translate("crm.dashboard.closingList.title", { ns: "starter" }, "Likely to close")}
            </CardTitle>
            <CardDescription>
              {translate(
                "crm.dashboard.closingList.description",
                { ns: "starter" },
                "Open deals with an expected close in the next 30 days."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {closingSoon.query.isLoading ? (
              <LoadingState className="min-h-40" />
            ) : closingSoon.result.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {translate(
                  "crm.dashboard.closingList.empty",
                  { ns: "starter" },
                  "No open deals are expected to close in the next 30 days."
                )}
              </p>
            ) : (
              <div className="space-y-1">
                {closingSoon.result.data.map((deal) => (
                  <button
                    type="button"
                    key={String(deal.id)}
                    onClick={() => openChild(`deals/edit/${deal.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {deal.title || "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {deal.customer?.company_name || "—"} ·{" "}
                        {labelFor(DEAL_STAGES, deal.stage ?? "inquiry", translate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(deal.amount, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(deal.expected_close_date, locale)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {translate("crm.dashboard.dormantList.title", { ns: "starter" }, "Accounts to touch")}
            </CardTitle>
            <CardDescription>
              {translate(
                "crm.dashboard.dormantList.description",
                { ns: "starter" },
                "Active accounts with no logged call, meeting or email in 30 days."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dormant.isLoading ? (
              <LoadingState className="min-h-40" />
            ) : (dormant.data?.dormant.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {translate(
                  "crm.dashboard.dormantList.empty",
                  { ns: "starter" },
                  "Every active account has been touched recently. Nice work."
                )}
              </p>
            ) : (
              <div className="space-y-1">
                {dormant.data?.dormant.map(({ customer, lastDate }) => (
                  <button
                    type="button"
                    key={String(customer.id)}
                    onClick={() => openChild(`customers/show/${customer.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent"
                  >
                    <span className="truncate text-sm font-medium">
                      {customer.company_name || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lastDate
                        ? translate(
                            "crm.dashboard.dormantList.lastTouch",
                            { ns: "starter" },
                            "Last touch"
                          ) + ` ${formatDate(lastDate, locale)}`
                        : translate(
                            "crm.dashboard.dormantList.never",
                            { ns: "starter" },
                            "Never contacted"
                          )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {translate("crm.dashboard.followUps.title", { ns: "starter" }, "Next follow-ups")}
            </CardTitle>
            <CardDescription>
              {translate(
                "crm.dashboard.followUps.description",
                { ns: "starter" },
                "The reminders due soonest."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextFollowUps.query.isLoading ? (
              <LoadingState className="min-h-40" />
            ) : nextFollowUps.result.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {translate(
                  "crm.dashboard.followUps.empty",
                  { ns: "starter" },
                  "No pending follow-ups."
                )}
              </p>
            ) : (
              <div className="space-y-1">
                {nextFollowUps.result.data.map((followUp) => {
                  const overdue = (followUp.due_date ?? "") < today;
                  return (
                    <button
                      type="button"
                      key={String(followUp.id)}
                      onClick={() => openChild(`follow-ups/edit/${followUp.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {followUp.subject || "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {followUp.customer?.company_name || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <EnumBadge
                          value="pending"
                          label={labelFor(FOLLOW_UP_STATUSES, "pending", translate)}
                        />
                        <span
                          className={
                            "text-xs tabular-nums " +
                            (overdue
                              ? "font-medium text-red-600 dark:text-red-400"
                              : "text-muted-foreground")
                          }
                        >
                          {formatDate(followUp.due_date, locale)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Outlet />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
