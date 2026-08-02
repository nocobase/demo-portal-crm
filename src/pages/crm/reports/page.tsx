import { useTranslate } from "@refinedev/core";
import ReactECharts from "echarts-for-react";
import { Download, Layers3, LineChart, Rows3, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { ListView } from "@/components/resources/views/list-view";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReportAnalytics } from "../analytics";
import { CRM_CHART_COLORS, DEAL_STAGES, formatCurrency, labelFor } from "../constants";
import { ChartCard, MetricCard } from "../overview-cards";
import { useLocale } from "../shared";

export function ReportsPage() {
  const translate = useTranslate();
  const locale = useLocale();
  const analytics = useReportAnalytics();
  const pipeline = analytics.data?.pipeline ?? [];
  const monthly = analytics.data?.monthly ?? [];
  const owners = useMemo(() => [...new Set(pipeline.map((row) => String(row.owner_name ?? translate("crm.reports.unassigned", { ns: "starter" }, "Unassigned"))))].sort(), [pipeline, translate]);
  const cell = (owner: string, stage: string) => pipeline.find((row) => String(row.owner_name ?? translate("crm.reports.unassigned", { ns: "starter" }, "Unassigned")) === owner && row.stage === stage);
  const totalPipeline = pipeline.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const wonTotal = monthly.reduce((sum, row) => sum + row.amount, 0);
  const pipelineOption = {
    color: CRM_CHART_COLORS,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { bottom: 0, textStyle: { color: "var(--muted-foreground)" } },
    grid: { left: 8, right: 12, top: 16, bottom: 52, containLabel: true },
    xAxis: { type: "category", data: owners, axisLabel: { color: "var(--muted-foreground)", rotate: owners.length > 5 ? 18 : 0 }, axisLine: { lineStyle: { color: "var(--border)" } } },
    yAxis: { type: "value", axisLabel: { color: "var(--muted-foreground)" }, splitLine: { lineStyle: { color: "var(--border)", opacity: 0.55 } } },
    series: DEAL_STAGES.map((stage) => ({ name: labelFor(DEAL_STAGES, stage.value, translate), type: "bar", stack: "pipeline", data: owners.map((owner) => Number(cell(owner, stage.value)?.amount ?? 0)), emphasis: { focus: "series" } })),
  };
  const monthlyOption = {
    color: ["#2563eb"],
    tooltip: { trigger: "axis" },
    grid: { left: 8, right: 36, top: 16, bottom: 28, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: monthly.map((row) => row.month), axisLabel: { color: "var(--muted-foreground)", interval: 0 }, axisLine: { lineStyle: { color: "var(--border)" } } },
    yAxis: { type: "value", axisLabel: { color: "var(--muted-foreground)" }, splitLine: { lineStyle: { color: "var(--border)", opacity: 0.55 } } },
    series: [{ type: "line", smooth: true, symbolSize: 8, lineStyle: { width: 3 }, areaStyle: { color: "rgba(37,99,235,0.14)" }, data: monthly.map((row) => row.amount) }],
  };
  const exportCsv = () => {
    const headers = [translate("crm.reports.csv.owner", { ns: "starter" }, "Owner"), ...DEAL_STAGES.map((stage) => labelFor(DEAL_STAGES, stage.value, translate)), translate("crm.reports.csv.total", { ns: "starter" }, "Total")];
    const rows = owners.map((owner) => {
      const amounts = DEAL_STAGES.map((stage) => Number(cell(owner, stage.value)?.amount ?? 0));
      return [owner, ...amounts, amounts.reduce((sum, amount) => sum + amount, 0)];
    });
    const monthlyHeader = [translate("crm.reports.csv.month", { ns: "starter" }, "Month"), translate("crm.reports.csv.wonAmount", { ns: "starter" }, "Won amount"), translate("crm.reports.csv.deals", { ns: "starter" }, "Won deals")];
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [headers, ...rows, [], monthlyHeader, ...monthly.map((row) => [row.month, row.amount, row.count])].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "crm-sales-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ListView resource="crm_reports">
      <div className="flex justify-end"><Button onClick={exportCsv}><Download />{translate("crm.reports.export", { ns: "starter" }, "Export CSV")}</Button></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label={translate("crm.reports.metrics.pipeline", { ns: "starter" }, "Total pipeline")} value={formatCurrency(totalPipeline, locale)} icon={<Layers3 className="size-5" />} loading={analytics.isLoading} />
        <MetricCard label={translate("crm.reports.metrics.won", { ns: "starter" }, "Won revenue")} value={formatCurrency(wonTotal, locale)} icon={<TrendingUp className="size-5" />} loading={analytics.isLoading} />
        <MetricCard label={translate("crm.reports.metrics.months", { ns: "starter" }, "Months reported")} value={monthly.length} icon={<LineChart className="size-5" />} loading={analytics.isLoading} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={translate("crm.reports.pipelineChart.title", { ns: "starter" }, "Pipeline by owner and stage")} description={translate("crm.reports.pipelineChart.description", { ns: "starter" }, "Stacked pipeline value for each sales owner.")}><ReactECharts option={pipelineOption} opts={{ renderer: "svg" }} style={{ height: 340 }} /></ChartCard>
        <ChartCard title={translate("crm.reports.monthlyChart.title", { ns: "starter" }, "Monthly won revenue")} description={translate("crm.reports.monthlyChart.description", { ns: "starter" }, "Closed-won value consolidated by month.")}><ReactECharts option={monthlyOption} opts={{ renderer: "svg" }} style={{ height: 340 }} /></ChartCard>
      </div>
      <ChartCard title={translate("crm.reports.pivot.title", { ns: "starter" }, "Pipeline pivot")} description={translate("crm.reports.pivot.description", { ns: "starter" }, "Owners on rows, deal stages on columns.")} action={<Rows3 className="size-5 text-blue-600" />}>
        <div className="overflow-x-auto rounded-lg border">
          <Table><TableHeader><TableRow><TableHead>{translate("crm.reports.csv.owner", { ns: "starter" }, "Owner")}</TableHead>{DEAL_STAGES.map((stage) => <TableHead key={stage.value} className="text-right">{labelFor(DEAL_STAGES, stage.value, translate)}</TableHead>)}<TableHead className="text-right">{translate("crm.reports.csv.total", { ns: "starter" }, "Total")}</TableHead></TableRow></TableHeader>
          <TableBody>{owners.map((owner) => {
            const amounts = DEAL_STAGES.map((stage) => Number(cell(owner, stage.value)?.amount ?? 0));
            return <TableRow key={owner}><TableCell className="font-medium">{owner}</TableCell>{amounts.map((amount, index) => <TableCell key={DEAL_STAGES[index].value} className="text-right tabular-nums">{formatCurrency(amount, locale)}</TableCell>)}<TableCell className="text-right font-semibold tabular-nums">{formatCurrency(amounts.reduce((sum, amount) => sum + amount, 0), locale)}</TableCell></TableRow>;
          })}</TableBody></Table>
        </div>
      </ChartCard>
      <ChartCard title={translate("crm.reports.monthlyTable.title", { ns: "starter" }, "Won by month")} description={translate("crm.reports.monthlyTable.description", { ns: "starter" }, "A pivot-ready monthly revenue series.")}>
        <div className="overflow-hidden rounded-lg border"><Table><TableHeader><TableRow><TableHead>{translate("crm.reports.csv.month", { ns: "starter" }, "Month")}</TableHead><TableHead className="text-right">{translate("crm.reports.csv.deals", { ns: "starter" }, "Won deals")}</TableHead><TableHead className="text-right">{translate("crm.reports.csv.wonAmount", { ns: "starter" }, "Won amount")}</TableHead></TableRow></TableHeader><TableBody>{monthly.map((row) => <TableRow key={row.month}><TableCell className="font-medium">{row.month}</TableCell><TableCell className="text-right tabular-nums">{row.count}</TableCell><TableCell className="text-right font-semibold tabular-nums">{formatCurrency(row.amount, locale)}</TableCell></TableRow>)}</TableBody></Table></div>
      </ChartCard>
    </ListView>
  );
}
