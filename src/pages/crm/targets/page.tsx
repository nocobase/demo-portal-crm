import { useList, useTranslate } from "@refinedev/core";
import ReactECharts from "echarts-for-react";
import { Award, CalendarDays, DollarSign, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { ListView } from "@/components/resources/views/list-view";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWonByOwner } from "../analytics";
import { CRM_CHART_COLORS, formatCurrency } from "../constants";
import { ChartCard, MetricCard } from "../overview-cards";
import { useLocale } from "../shared";
import type { TargetRecord } from "../types";

export function TargetsPage() {
  const translate = useTranslate();
  const locale = useLocale();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { result, query } = useList<TargetRecord>({
    resource: "crm_targets",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
    sorters: [{ field: "period", order: "desc" }],
    meta: { appends: ["owner"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });
  const actuals = useWonByOwner(month);
  const rows = useMemo(() => result.data
    .filter((target) => target.period?.startsWith(month))
    .map((target) => {
      const actual = actuals.data?.find((item) => String(item.owner_id) === String(target.owner_id));
      const quota = Number(target.quota_amount ?? 0);
      const won = Number(actual?.won_amount ?? 0);
      return {
        ...target,
        ownerName: target.owner?.nickname ?? String(actual?.owner_name ?? "—"),
        won,
        dealCount: Number(actual?.deal_count ?? 0),
        attainment: quota > 0 ? (won / quota) * 100 : 0,
      };
    })
    .sort((left, right) => right.attainment - left.attainment), [actuals.data, month, result.data]);
  const quotaTotal = rows.reduce((sum, row) => sum + Number(row.quota_amount ?? 0), 0);
  const wonTotal = rows.reduce((sum, row) => sum + row.won, 0);
  const attainment = quotaTotal ? (wonTotal / quotaTotal) * 100 : 0;
  const chartOption = {
    color: CRM_CHART_COLORS,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { bottom: 0, textStyle: { color: "var(--muted-foreground)" } },
    grid: { left: 12, right: 16, top: 12, bottom: 42, containLabel: true },
    xAxis: { type: "category", data: rows.map((row) => row.ownerName), axisLabel: { color: "var(--muted-foreground)" }, axisLine: { lineStyle: { color: "var(--border)" } } },
    yAxis: { type: "value", axisLabel: { color: "var(--muted-foreground)" }, splitLine: { lineStyle: { color: "var(--border)", opacity: 0.55 } } },
    series: [
      { name: translate("crm.targets.quota", { ns: "starter" }, "Quota"), type: "bar", barMaxWidth: 34, data: rows.map((row) => row.quota_amount ?? 0), itemStyle: { color: "#bfdbfe", borderRadius: [6, 6, 0, 0] } },
      { name: translate("crm.targets.actual", { ns: "starter" }, "Won revenue"), type: "bar", barMaxWidth: 34, data: rows.map((row) => row.won), itemStyle: { color: "#2563eb", borderRadius: [6, 6, 0, 0] } },
    ],
  };

  return (
    <ListView resource="crm_targets">
      <div className="flex items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="space-y-2"><Label htmlFor="target-month">{translate("crm.targets.period", { ns: "starter" }, "Target month")}</Label><Input id="target-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>
        <CalendarDays className="mb-2 size-5 text-blue-600" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={translate("crm.targets.totalQuota", { ns: "starter" }, "Team quota")} value={formatCurrency(quotaTotal, locale)} icon={<DollarSign className="size-5" />} loading={query.isLoading} />
        <MetricCard label={translate("crm.targets.won", { ns: "starter" }, "Won revenue")} value={formatCurrency(wonTotal, locale)} icon={<Trophy className="size-5" />} loading={actuals.isLoading} />
        <MetricCard label={translate("crm.targets.attainment", { ns: "starter" }, "Team attainment")} value={`${attainment.toFixed(1)}%`} icon={<Award className="size-5" />} loading={actuals.isLoading} />
        <MetricCard label={translate("crm.targets.topRep", { ns: "starter" }, "Top performer")} value={rows[0]?.ownerName ?? "—"} detail={rows[0] ? `${rows[0].attainment.toFixed(1)}%` : undefined} icon={<Trophy className="size-5" />} loading={actuals.isLoading} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <ChartCard title={translate("crm.targets.chart.title", { ns: "starter" }, "Quota versus actual")} description={translate("crm.targets.chart.description", { ns: "starter" }, "Won revenue compared with each owner's monthly target.")}>
          <ReactECharts option={chartOption} opts={{ renderer: "svg" }} style={{ height: 340 }} />
        </ChartCard>
        <ChartCard title={translate("crm.targets.leaderboard.title", { ns: "starter" }, "Owner leaderboard")} description={translate("crm.targets.leaderboard.description", { ns: "starter" }, "Ranked by percentage of quota attained.")}>
          <div className="overflow-hidden rounded-lg border">
            <Table><TableHeader><TableRow>
              <TableHead className="w-12">#</TableHead><TableHead>{translate("crm.targets.owner", { ns: "starter" }, "Owner")}</TableHead><TableHead className="text-right">{translate("crm.targets.actual", { ns: "starter" }, "Won revenue")}</TableHead><TableHead className="w-32">{translate("crm.targets.attainment", { ns: "starter" }, "Attainment")}</TableHead>
            </TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={String(row.id)}>
              <TableCell className="font-semibold text-blue-600">{index + 1}</TableCell><TableCell><div className="font-medium">{row.ownerName}</div><div className="text-xs text-muted-foreground">{translate("crm.targets.dealsWon", { ns: "starter", count: row.dealCount }, `${row.dealCount} won deals`)}</div></TableCell><TableCell className="text-right font-semibold tabular-nums">{formatCurrency(row.won, locale)}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={Math.min(row.attainment, 100)} className="w-20" /><span className="text-xs font-semibold tabular-nums">{row.attainment.toFixed(0)}%</span></div></TableCell>
            </TableRow>)}</TableBody></Table>
          </div>
        </ChartCard>
      </div>
    </ListView>
  );
}
