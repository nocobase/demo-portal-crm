import { useList, useTranslate, useUpdate } from "@refinedev/core";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/components/app-shell/loading-state";
import { ListView } from "@/components/resources/views/list-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CrmAIContext, CrmAIShortcut, usePipelineTasks } from "../ai-assistant";
import { DEAL_STAGES, formatCurrency, formatDate, labelFor } from "../constants";
import {
  ListDateRange,
  ListFilterSelect,
  ListSearchInput,
  ListToolbar,
  dateRangeFilter,
  searchFilter,
  useDebouncedValue,
} from "../list-controls";
import { useCustomerOptions, useOwnerOptions } from "../pickers";
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
  const { options: ownerOptions } = useOwnerOptions();
  const { options: customerOptions } = useCustomerOptions();
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [closeFrom, setCloseFrom] = useState("");
  const [closeTo, setCloseTo] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const filters = useMemo(
    () => [
      ...searchFilter(["title", "notes"], debouncedSearch),
      ...(owner === "all"
        ? []
        : [{ field: "ownerId", operator: "eq" as const, value: owner }]),
      ...(customer === "all"
        ? []
        : [{ field: "customer_id", operator: "eq" as const, value: customer }]),
      ...dateRangeFilter("expected_close_date", closeFrom, closeTo),
    ],
    [closeFrom, closeTo, customer, debouncedSearch, owner]
  );

  const { result, query } = useList<DealRecord>({
    resource: "crm_deals",
    filters,
    // The board renders every stage at once, so it keeps a large page rather
    // than paginating; the filters above are what keep the result set small.
    pagination: { mode: "server", currentPage: 1, pageSize: 300 },
    meta: { appends: ["customer", "owner"] },
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

  const aiTasks = usePipelineTasks(translate);

  return (
    <CrmAIContext
      id="crm-pipeline-board"
      title={translate("crm.ai.context.pipeline", { ns: "starter" }, "Deal pipeline")}
      kind="record-list"
      getContext={() => ({
        resource: "crm_deals",
        filters: { search, owner, customer, closeFrom, closeTo },
        stages: DEAL_STAGES.map((stage) => ({
          stage: stage.value,
          count: (grouped[stage.value] ?? []).length,
          value: (grouped[stage.value] ?? []).reduce(
            (sum, deal) => sum + Number(deal.amount ?? 0),
            0
          ),
          deals: (grouped[stage.value] ?? []).map((deal) => ({
            id: deal.id,
            title: deal.title,
            amount: deal.amount,
            expected_close_date: deal.expected_close_date,
            customer: deal.customer?.company_name ?? null,
            owner: deal.owner?.nickname ?? null,
          })),
        })),
      })}
    >
    <ListView resource="crm_deals">
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListSearchInput
            value={search}
            onChange={setSearch}
            placeholder={translate("crm.pipeline.search", { ns: "starter" }, "Search deal title or notes")}
          />
          <ListFilterSelect
            value={owner}
            onChange={setOwner}
            options={ownerOptions}
            allLabel={translate("crm.common.allOwners", { ns: "starter" }, "All owners")}
          />
          <ListFilterSelect
            value={customer}
            onChange={setCustomer}
            options={customerOptions}
            allLabel={translate("crm.common.allCustomers", { ns: "starter" }, "All customers")}
          />
          <ListDateRange
            from={closeFrom}
            to={closeTo}
            onFromChange={setCloseFrom}
            onToChange={setCloseTo}
            label={translate("crm.deals.fields.expectedClose", { ns: "starter" }, "Expected close")}
          />
          <div className="lg:ml-auto">
            <CrmAIShortcut
              tasks={aiTasks}
              label={translate("crm.ai.askAssistant", { ns: "starter" }, "Ask the CRM assistant")}
            />
          </div>
        </ListToolbar>
      </div>
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
        <div className="flex gap-4 overflow-x-auto pb-3">
          {DEAL_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.value}
              stage={stage}
              deals={grouped[stage.value] ?? []}
              locale={locale}
              isDragOver={dragOverStage === stage.value}
              onDragEnter={() => setDragOverStage(stage.value)}
              onDragLeave={() => setDragOverStage(null)}
              onDropDeal={(dealId) => {
                setDragOverStage(null);
                const deal = result.data.find(
                  (item) => String(item.id) === dealId
                );
                if (deal) moveDeal(deal, stage.value);
              }}
              onOpen={(id) => openChild(`show/${id}`)}
            />
          ))}
        </div>
      )}
    </ListView>
    </CrmAIContext>
  );
}

function stageExists(stage: string): boolean {
  return DEAL_STAGES.some((item) => item.value === stage);
}

// Cards revealed per scroll step. The board keeps the whole (filtered) result in
// memory, so each column renders a growing window and reveals more as the visitor
// scrolls to the bottom — keeps long stages light without a second round-trip.
const COLUMN_PAGE_SIZE = 10;

function PipelineColumn({
  stage,
  deals,
  locale,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDropDeal,
  onOpen,
}: {
  stage: (typeof DEAL_STAGES)[number];
  deals: DealRecord[];
  locale: string;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDropDeal: (dealId: string) => void;
  onOpen: (id: DealRecord["id"]) => void;
}) {
  const translate = useTranslate();
  const [visible, setVisible] = useState(COLUMN_PAGE_SIZE);

  // Reset the window whenever the underlying (filtered/sorted) set changes.
  useEffect(() => {
    setVisible(COLUMN_PAGE_SIZE);
  }, [deals]);

  const total = deals.reduce((sum, deal) => sum + Number(deal.amount ?? 0), 0);
  const shown = deals.slice(0, visible);
  const hasMore = visible < deals.length;
  const revealMore = () =>
    setVisible((current) => Math.min(current + COLUMN_PAGE_SIZE, deals.length));

  return (
    <div
      data-stage={stage.value}
      className={cn(
        "flex max-h-[calc(100vh-15rem)] min-h-72 w-[300px] shrink-0 flex-col rounded-xl border bg-muted/25 transition-colors",
        isDragOver && "border-primary/60 bg-primary/5"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        onDropDeal(event.dataTransfer.getData("text/plain"));
      }}
    >
      <div className="flex items-baseline justify-between border-b px-3 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">
            {labelFor(DEAL_STAGES, stage.value, translate)}
          </span>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {formatCurrency(total, locale)}
        </span>
      </div>
      <div
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
        onScroll={(event) => {
          const el = event.currentTarget;
          if (
            hasMore &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 120
          ) {
            revealMore();
          }
        }}
      >
        {deals.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {translate("crm.pipeline.emptyColumn", { ns: "starter" }, "Drop a deal here")}
          </p>
        ) : (
          <>
            {shown.map((deal) => (
              <PipelineCard
                key={String(deal.id)}
                deal={deal}
                locale={locale}
                onOpen={() => onOpen(deal.id)}
              />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={revealMore}
                className="mt-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
              >
                {translate("crm.pipeline.loadMore", { ns: "starter" }, "Load more")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
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
        {deal.owner?.nickname ? ` · ${deal.owner.nickname}` : ""}
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
