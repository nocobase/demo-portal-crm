import { useList, useTranslate, useUpdate } from "@refinedev/core";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingState } from "@/components/app-shell/loading-state";
import { ListView } from "@/components/resources/views/list-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { DEAL_STAGES, formatCurrency, formatDate, labelFor } from "../constants";
import { useOpenContextualChild } from "../route-surfaces";
import { useLocale } from "../shared";
import type { DealRecord } from "../types";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function PipelinePage() {
  const translate = useTranslate();
  const locale = useLocale();
  const openChild = useOpenContextualChild();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const { mutate: updateDeal } = useUpdate<DealRecord>();

  const { result, query } = useList<DealRecord>({
    resource: "crm_deals",
    pagination: { mode: "server", currentPage: 1, pageSize: 300 },
    meta: { appends: ["customer"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const grouped = useMemo(() => {
    const buckets: Record<string, DealRecord[]> = {};
    for (const stage of DEAL_STAGES) {
      buckets[stage.value] = [];
    }
    for (const deal of result.data) {
      const stage = deal.stage && stageExists(deal.stage) ? deal.stage : "inquiry";
      buckets[stage].push(deal);
    }
    const sortByExpectedClose = (left: DealRecord, right: DealRecord) =>
      (left.expected_close_date ?? "9999").localeCompare(
        right.expected_close_date ?? "9999"
      );
    Object.values(buckets).forEach((bucket) =>
      bucket.sort(sortByExpectedClose)
    );
    return buckets;
  }, [result.data]);

  const moveDeal = (deal: DealRecord, stage: string) => {
    if (deal.stage === stage) return;
    updateDeal({
      resource: "crm_deals",
      id: deal.id,
      values: {
        stage,
        closed_date:
          stage === "won" || stage === "lost" ? todayIso() : null,
      },
    });
  };

  return (
    <ListView resource="crm_deals">
      {query.isLoading ? (
        <LoadingState className="min-h-64" />
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>
            {translate("crm.pipeline.loadError.title", { ns: "starter" }, "Unable to load pipeline")}
          </AlertTitle>
          <AlertDescription>
            {translate(
              "crm.pipeline.loadError.description",
              { ns: "starter" },
              "Check your connection and try again."
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DEAL_STAGES.map((stage) => {
            const deals = grouped[stage.value] ?? [];
            const total = deals.reduce(
              (sum, deal) => sum + Number(deal.amount ?? 0),
              0
            );
            return (
              <div
                key={stage.value}
                data-stage={stage.value}
                className={cn(
                  "flex min-h-72 flex-col rounded-xl border bg-muted/25 transition-colors",
                  dragOverStage === stage.value &&
                    "border-primary/60 bg-primary/5"
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStage(stage.value);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverStage(null);
                  const dealId = event.dataTransfer.getData("text/plain");
                  const deal = result.data.find(
                    (item) => String(item.id) === dealId
                  );
                  if (deal) moveDeal(deal, stage.value);
                }}
              >
                <div className="flex items-baseline justify-between border-b px-3 py-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{labelFor(DEAL_STAGES, stage.value, translate)}</span>
                    <span className="text-xs text-muted-foreground">
                      {deals.length}
                    </span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {formatCurrency(total, locale)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {deals.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                      {translate("crm.pipeline.emptyColumn", { ns: "starter" }, "Drop a deal here")}
                    </p>
                  ) : (
                    deals.map((deal) => (
                      <PipelineCard
                        key={String(deal.id)}
                        deal={deal}
                        locale={locale}
                        onOpen={() => openChild(`edit/${deal.id}`)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ListView>
  );
}

function stageExists(stage: string): boolean {
  return DEAL_STAGES.some((item) => item.value === stage);
}

function PipelineCard({
  deal,
  locale,
  onOpen,
}: {
  deal: DealRecord;
  locale: string;
  onOpen: () => void;
}) {
  const translate = useTranslate();
  const isOpen = deal.stage === "inquiry" || deal.stage === "quote";
  const isOverdue =
    isOpen &&
    Boolean(deal.expected_close_date) &&
    (deal.expected_close_date as string) < todayIso();

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) =>
        event.dataTransfer.setData("text/plain", String(deal.id))
      }
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-1.5 rounded-lg border bg-card p-3 text-left shadow-xs transition-shadow hover:shadow-sm"
    >
      <span className="line-clamp-2 text-sm font-medium">
        {deal.title || "—"}
      </span>
      <span className="text-xs text-muted-foreground">
        {deal.customer?.company_name ||
          translate("crm.pipeline.noCustomer", { ns: "starter" }, "No customer")}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(deal.amount, locale)}
        </span>
        {deal.expected_close_date ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs tabular-nums",
              isOverdue
                ? "font-medium text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            )}
          >
            {isOverdue ? <AlertTriangle className="size-3" /> : null}
            {formatDate(deal.expected_close_date, locale)}
          </span>
        ) : null}
      </div>
    </button>
  );
}
