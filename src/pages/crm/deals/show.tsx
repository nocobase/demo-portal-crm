import { useList, useShow, useTranslate } from "@refinedev/core";
import {
  Building2,
  Eye,
  Gauge,
  HandCoins,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useOutlet, useParams } from "react-router";
import { LoadingState } from "@/components/app-shell/loading-state";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { EditButton } from "@/components/resources/buttons/edit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteDrawer } from "@/extensions/nocobase-route-surfaces";
import { CrmAIContext, CrmAIShortcut, useDealDetailTasks } from "../ai-assistant";
import { RecordLink, useOpenRecord } from "../record-links";
import {
  ACTIVITY_TYPES,
  DEAL_STAGES,
  DEAL_STAGE_PROBABILITY,
  QUOTE_STATUSES,
  formatCurrency,
  formatDate,
  formatDateTime,
  labelFor,
} from "../constants";
import {
  useContextualCloseTo,
  useOpenContextualChild,
} from "../route-surfaces";
import { DetailItems, DrawerSection, EnumBadge, useLocale } from "../shared";
import type { ActivityRecord, DealRecord, QuoteRecord } from "../types";

export function DealShow({ idParam = "id" }: { idParam?: string }) {
  const translate = useTranslate();
  const locale = useLocale();
  const openChild = useOpenContextualChild();
  const openRecord = useOpenRecord();
  const closeTo = useContextualCloseTo();
  const params = useParams<Record<string, string>>();
  const id = params[idParam];
  const nested = useOutlet();
  const { result: record, query } = useShow<DealRecord>({
    resource: "crm_deals",
    id,
    meta: { appends: ["customer", "contact", "owner"] },
  });
  const aiTasks = useDealDetailTasks(translate);

  const displayName =
    record?.title ||
    translate("crm.deals.detail.unnamed", { ns: "starter" }, "Untitled deal");
  const stage = record?.stage ?? "inquiry";
  const probability = DEAL_STAGE_PROBABILITY[stage] ?? 0;
  const weighted = Number(record?.amount ?? 0) * probability;

  return (
    <CrmAIContext
      id="crm-deal-detail"
      title={translate("crm.ai.context.deal", { ns: "starter" }, "Deal detail")}
      getContext={() => ({
        resource: "crm_deals",
        record: record
          ? {
              id: record.id,
              title: record.title,
              stage: record.stage,
              amount: record.amount,
              weighted_amount: weighted,
              expected_close_date: record.expected_close_date,
              closed_date: record.closed_date,
              customer: record.customer?.company_name ?? null,
              contact: record.contact?.name ?? null,
              owner: record.owner?.nickname ?? null,
              notes: record.notes,
            }
          : null,
      })}
    >
    <RouteDrawer
      title={
        query.isLoading && !record ? <Skeleton className="h-6 w-40" /> : displayName
      }
      description={translate(
        "crm.deals.drawer.show.description",
        { ns: "starter" },
        "Deal value, linked quotes and logged activity."
      )}
      closeLabel={translate("crm.common.close", { ns: "starter" }, "Close")}
      closeTo={closeTo}
      nested={nested}
      actions={
        <div className="flex items-center gap-2">
          <CrmAIShortcut tasks={aiTasks} />
          {record ? (
            <EditButton
              resource="crm_deals"
              recordItemId={record.id}
              variant="outline"
              size="icon-sm"
              onClick={() => openChild("edit")}
            >
              <Pencil />
            </EditButton>
          ) : null}
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {query.isLoading ? (
          <LoadingState className="min-h-64" />
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {translate("crm.deals.detail.loadError.title", { ns: "starter" }, "Unable to load deal")}
            </AlertTitle>
            <AlertDescription>
              {translate(
                "crm.deals.detail.loadError.description",
                { ns: "starter" },
                "The deal may no longer exist, or you may not have permission to view it."
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-xl border bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent p-5">
                <div className="flex items-center justify-between">
                  <HandCoins className="size-5 text-blue-600" />
                  <EnumBadge value={stage} label={labelFor(DEAL_STAGES, stage, translate)} />
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  {translate("crm.deals.fields.amount", { ns: "starter" }, "Amount")}
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {formatCurrency(record?.amount, locale)}
                </p>
              </div>
              <div className="rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <Gauge className="size-5 text-blue-600" />
                  <span className="text-sm font-medium tabular-nums">{Math.round(probability * 100)}%</span>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  {translate("crm.deals.detail.weighted", { ns: "starter" }, "Weighted value")}
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {formatCurrency(weighted, locale)}
                </p>
                <Progress value={probability * 100} className="mt-4" />
              </div>
            </div>

            <DetailItems
              title={translate("crm.deals.detail.overview", { ns: "starter" }, "Overview")}
              items={[
                [
                  translate("crm.deals.fields.customer", { ns: "starter" }, "Customer"),
                  <span key="customer" className="inline-flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <RecordLink
                      label={record?.customer?.company_name}
                      onClick={() =>
                        record?.customer_id &&
                        openRecord.customer(record.customer_id)
                      }
                    />
                  </span>,
                ],
                [
                  translate("crm.deals.fields.contact", { ns: "starter" }, "Contact"),
                  <span key="contact" className="inline-flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    {record?.contact?.name || "—"}
                  </span>,
                ],
                [
                  translate("crm.deals.fields.expectedClose", { ns: "starter" }, "Expected close"),
                  formatDate(record?.expected_close_date, locale),
                ],
                [
                  translate("crm.deals.fields.closedDate", { ns: "starter" }, "Closed date"),
                  formatDate(record?.closed_date, locale),
                ],
                [
                  translate("crm.deals.fields.notes", { ns: "starter" }, "Notes"),
                  record?.notes || "—",
                ],
              ]}
            />

            {id ? (
              <>
                <Separator />
                <QuotesSection dealId={id} locale={locale} openChild={openChild} />
                <Separator />
                <ActivitiesSection dealId={id} locale={locale} openChild={openChild} />
              </>
            ) : null}
          </div>
        )}
      </div>
    </RouteDrawer>
    </CrmAIContext>
  );
}

type OpenChild = (to: string) => void;

function SimpleTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

const EmptyRow = ({ colSpan, text }: { colSpan: number; text: string }) => (
  <tr>
    <td colSpan={colSpan} className="px-3 py-6 text-center text-muted-foreground">{text}</td>
  </tr>
);

function QuotesSection({
  dealId,
  locale,
  openChild,
}: {
  dealId: string;
  locale: string;
  openChild: OpenChild;
}) {
  const translate = useTranslate();
  const { result } = useList<QuoteRecord>({
    resource: "crm_quotes",
    pagination: { mode: "server", currentPage: 1, pageSize: 50 },
    sorters: [{ field: "issue_date", order: "desc" }],
    filters: [{ field: "deal_id", operator: "eq", value: dealId }],
    errorNotification: false,
    queryOptions: { retry: false },
  });

  return (
    <DrawerSection
      title={translate("crm.deals.detail.quotes", { ns: "starter" }, "Quotes")}
      action={
        <Button variant="outline" size="sm" onClick={() => openChild("quotes/create")}>
          <Plus />
          {translate("crm.quotes.actions.add", { ns: "starter" }, "Add quote")}
        </Button>
      }
    >
      <SimpleTable
        headers={[
          translate("crm.quotes.fields.number", { ns: "starter" }, "Quote"),
          translate("crm.quotes.fields.status", { ns: "starter" }, "Status"),
          translate("crm.quotes.fields.validUntil", { ns: "starter" }, "Valid until"),
          translate("crm.quotes.fields.total", { ns: "starter" }, "Total"),
          translate("crm.common.actions", { ns: "starter" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow colSpan={5} text={translate("crm.deals.quotes.empty", { ns: "starter" }, "No quotes for this deal yet.")} />
        ) : (
          result.data.map((quote) => (
            <tr key={String(quote.id)}>
              <td className="px-3 py-2 font-mono font-medium">
                <RecordLink
                  label={quote.quote_number}
                  onClick={() =>
                    openChild(`quotes/show/${encodeURIComponent(String(quote.id))}`)
                  }
                />
              </td>
              <td className="px-3 py-2">
                <EnumBadge value={quote.status ?? "draft"} label={labelFor(QUOTE_STATUSES, quote.status ?? "draft", translate)} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(quote.valid_until, locale)}</td>
              <td className="px-3 py-2 tabular-nums">{formatCurrency(quote.total, locale)}</td>
              <td className="px-3 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openChild(`quotes/show/${encodeURIComponent(String(quote.id))}`)}
                >
                  <Eye />
                  <span className="sr-only">{translate("crm.quotes.actions.view", { ns: "starter" }, "View quote")}</span>
                </Button>
              </td>
            </tr>
          ))
        )}
      </SimpleTable>
    </DrawerSection>
  );
}

function ActivitiesSection({
  dealId,
  locale,
  openChild,
}: {
  dealId: string;
  locale: string;
  openChild: OpenChild;
}) {
  const translate = useTranslate();
  const openRecord = useOpenRecord();
  const { result } = useList<ActivityRecord>({
    resource: "crm_activities",
    pagination: { mode: "server", currentPage: 1, pageSize: 50 },
    sorters: [{ field: "date", order: "desc" }],
    filters: [{ field: "dealId", operator: "eq", value: dealId }],
    meta: { appends: ["contact"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  return (
    <DrawerSection
      title={translate("crm.deals.detail.activities", { ns: "starter" }, "Activity log")}
      action={
        <Button variant="outline" size="sm" onClick={() => openChild("activities/create")}>
          <Plus />
          {translate("crm.activities.actions.add", { ns: "starter" }, "Log activity")}
        </Button>
      }
    >
      <SimpleTable
        headers={[
          translate("crm.activities.fields.date", { ns: "starter" }, "Date"),
          translate("crm.activities.fields.type", { ns: "starter" }, "Type"),
          translate("crm.activities.fields.subject", { ns: "starter" }, "Subject"),
          translate("crm.common.actions", { ns: "starter" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow colSpan={4} text={translate("crm.deals.activities.empty", { ns: "starter" }, "No activity logged against this deal yet.")} />
        ) : (
          result.data.map((activity) => (
            <tr key={String(activity.id)}>
              <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(activity.date, locale)}</td>
              <td className="px-3 py-2">
                <EnumBadge value={activity.type ?? "call"} label={labelFor(ACTIVITY_TYPES, activity.type ?? "call", translate)} />
              </td>
              <td className="px-3 py-2 font-medium">
                <RecordLink
                  label={activity.subject}
                  onClick={() => openRecord.activity(activity.id)}
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openChild(`activities/edit/${encodeURIComponent(String(activity.id))}`)}
                  >
                    <Pencil />
                  </Button>
                  <DeleteButton
                    resource="crm_activities"
                    recordItemId={activity.id}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 />
                  </DeleteButton>
                </div>
              </td>
            </tr>
          ))
        )}
      </SimpleTable>
    </DrawerSection>
  );
}