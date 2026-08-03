import { useList, useNotification, useOne, useTranslate } from "@refinedev/core";
import { CalendarClock, CheckCircle2, Eye, FileText, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { LoadingState } from "@/components/app-shell/loading-state";
import { ListView } from "@/components/resources/views/list-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RouteDrawer } from "@/extensions/nocobase-route-surfaces";
import { nocobaseClient } from "@nocobase/portal-sdk/client";
import { CrmAIContext, CrmAIShortcut, useQuoteDetailTasks } from "../ai-assistant";
import { EntityPicker, useCustomerOptions, useProductOptions } from "../pickers";
import { QUOTE_STATUSES, formatCurrency, formatDate, labelFor } from "../constants";
import {
  ListFilterSelect,
  ListPagination,
  ListSearchInput,
  ListDateRange,
  ListToolbar,
  ListToolbarContent,
  dateRangeFilter,
  searchFilter,
  useDebouncedValue,
  useListPagination,
  useResetPageOnFilterChange,
} from "../list-controls";
import { MetricCard } from "../overview-cards";
import { useContextualCloseTo, useOpenContextualChild } from "../route-surfaces";
import { DetailItems, DrawerSection, EnumBadge, useLocale } from "../shared";
import type { QuoteItemRecord, QuoteRecord } from "../types";

export function QuotesPage() {
  const translate = useTranslate();
  const locale = useLocale();
  const openChild = useOpenContextualChild();
  const [status, setStatus] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [search, setSearch] = useState("");
  const [issuedFrom, setIssuedFrom] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { currentPage, pageSize, setCurrentPage, setPageSize } =
    useListPagination();
  const { options: customerOptions } = useCustomerOptions();

  const filters = useMemo(
    () => [
      ...searchFilter(["quote_number"], debouncedSearch),
      ...(status === "all"
        ? []
        : [{ field: "status", operator: "eq" as const, value: status }]),
      ...(customer === "all"
        ? []
        : [{ field: "customer_id", operator: "eq" as const, value: customer }]),
      ...dateRangeFilter("issue_date", issuedFrom, issuedTo),
    ],
    [customer, debouncedSearch, issuedFrom, issuedTo, status]
  );
  useResetPageOnFilterChange(
    `${debouncedSearch}|${status}|${customer}|${issuedFrom}|${issuedTo}`,
    setCurrentPage
  );

  const { result, query } = useList<QuoteRecord>({
    resource: "crm_quotes",
    filters,
    pagination: { mode: "server", currentPage, pageSize },
    sorters: [{ field: "issue_date", order: "desc" }],
    meta: { appends: ["customer", "deal"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });
  // Headline numbers cover every quote, not just the current page.
  const summary = useList<QuoteRecord>({
    resource: "crm_quotes",
    pagination: { mode: "server", currentPage: 1, pageSize: 500 },
    meta: { fields: ["id", "status", "total", "valid_until"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const visible = result.data;
  const quotes = summary.result.data;
  const totalValue = quotes.reduce((sum, quote) => sum + Number(quote.total ?? 0), 0);
  const acceptedValue = quotes.filter((quote) => quote.status === "accepted").reduce((sum, quote) => sum + Number(quote.total ?? 0), 0);
  const expiring = quotes.filter((quote) => quote.status === "sent" && (quote.valid_until ?? "") <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length;

  const statusOptions = useMemo(
    () =>
      QUOTE_STATUSES.map((item) => ({
        value: item.value,
        label: labelFor(QUOTE_STATUSES, item.value, translate),
      })),
    [translate]
  );

  return (
    <ListView resource="crm_quotes">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={translate("crm.quotes.metrics.total", { ns: "starter" }, "Quote value")} value={formatCurrency(totalValue, locale)} icon={<ReceiptText className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.quotes.metrics.accepted", { ns: "starter" }, "Accepted value")} value={formatCurrency(acceptedValue, locale)} icon={<CheckCircle2 className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.quotes.metrics.open", { ns: "starter" }, "Open quotes")} value={quotes.filter((quote) => ["draft", "sent"].includes(quote.status ?? "")).length} icon={<FileText className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.quotes.metrics.expiring", { ns: "starter" }, "Expiring soon")} value={expiring} detail={translate("crm.quotes.metrics.expiringDetail", { ns: "starter" }, "Sent quotes valid for 30 days or less")} icon={<CalendarClock className="size-5" />} loading={summary.query.isLoading} />
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListToolbarContent>
            <ListSearchInput
              value={search}
              onChange={setSearch}
              placeholder={translate("crm.quotes.search", { ns: "starter" }, "Search quote number")}
            />
            <ListFilterSelect
              value={status}
              onChange={setStatus}
              options={statusOptions}
              allLabel={translate("crm.quotes.allStatuses", { ns: "starter" }, "All quotes")}
            />
            <ListFilterSelect
              value={customer}
              onChange={setCustomer}
              options={customerOptions}
              allLabel={translate("crm.common.allCustomers", { ns: "starter" }, "All customers")}
            />
            <ListDateRange
              from={issuedFrom}
              to={issuedTo}
              onFromChange={setIssuedFrom}
              onToChange={setIssuedTo}
              label={translate("crm.quotes.fields.issueDate", { ns: "starter" }, "Issue date")}
            />
          </ListToolbarContent>
        </ListToolbar>
        {query.isLoading ? <LoadingState className="min-h-96" /> : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{translate("crm.quotes.fields.number", { ns: "starter" }, "Quote")}</TableHead>
                  <TableHead>{translate("crm.quotes.fields.customer", { ns: "starter" }, "Customer")}</TableHead>
                  <TableHead>{translate("crm.quotes.fields.deal", { ns: "starter" }, "Deal")}</TableHead>
                  <TableHead>{translate("crm.quotes.fields.status", { ns: "starter" }, "Status")}</TableHead>
                  <TableHead>{translate("crm.quotes.fields.validUntil", { ns: "starter" }, "Valid until")}</TableHead>
                  <TableHead className="text-right">{translate("crm.quotes.fields.total", { ns: "starter" }, "Total")}</TableHead>
                  <TableHead className="w-16"><span className="sr-only">{translate("crm.common.actions", { ns: "starter" }, "Actions")}</span></TableHead>
                </TableRow></TableHeader>
                <TableBody>{visible.map((quote) => (
                  <TableRow key={String(quote.id)} className="cursor-pointer" onClick={() => openChild(`show/${quote.id}`)}>
                    <TableCell><div className="font-mono text-sm font-semibold">{quote.quote_number}</div><div className="text-xs text-muted-foreground">{formatDate(quote.issue_date, locale)}</div></TableCell>
                    <TableCell className="font-medium">{quote.customer?.company_name ?? "—"}</TableCell>
                    <TableCell className="max-w-64 truncate">{quote.deal?.title ?? "—"}</TableCell>
                    <TableCell><EnumBadge value={quote.status} label={labelFor(QUOTE_STATUSES, quote.status, translate)} /></TableCell>
                    <TableCell>{formatDate(quote.valid_until, locale)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(quote.total, locale)}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); openChild(`show/${quote.id}`); }}><Eye /><span className="sr-only">{translate("crm.quotes.actions.view", { ns: "starter" }, "View quote")}</span></Button><Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); openChild(`edit/${quote.id}`); }}><Pencil /><span className="sr-only">{translate("crm.quotes.actions.edit", { ns: "starter" }, "Edit quote")}</span></Button></div></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
              {visible.length === 0 ? (
                <p className="px-4 py-14 text-center text-sm text-muted-foreground">{translate("crm.quotes.empty", { ns: "starter" }, "No quotes match the current filters.")}</p>
              ) : null}
            </div>
            <ListPagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={result.total ?? visible.length}
              setCurrentPage={setCurrentPage}
              setPageSize={setPageSize}
            />
          </>
        )}
      </div>
    </ListView>
  );
}

export function QuoteShow({ idParam = "id" }: { idParam?: string }) {
  const params = useParams<Record<string, string>>();
  const id = params[idParam];
  const translate = useTranslate();
  const locale = useLocale();
  const closeTo = useContextualCloseTo();
  const { open } = useNotification();
  const { options: productOptions } = useProductOptions();
  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const { result: quote, query } = useOne<QuoteRecord>({
    resource: "crm_quotes",
    id,
    meta: { appends: ["customer", "deal"] },
    queryOptions: { enabled: Boolean(id), retry: false },
  });
  const itemsQuery = useList<QuoteItemRecord>({
    resource: "crm_quote_items",
    filters: id ? [{ field: "quote_id", operator: "eq", value: id }] : [],
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
    sorters: [{ field: "createdAt", order: "asc" }],
    meta: { appends: ["product"] },
    errorNotification: false,
    queryOptions: { enabled: Boolean(id), retry: false },
  });
  const items = itemsQuery.result.data;
  const calculatedTotal = items.reduce((sum, item) => sum + Number(item.qty ?? 0) * Number(item.unit_price ?? 0), 0);
  const aiTasks = useQuoteDetailTasks(translate);

  const selectProduct = (value: string | null) => {
    setProductId(value);
    const selected = productOptions.find((option) => option.value === value)?.product;
    setUnitPrice(Number(selected?.unit_price ?? 0));
  };
  const syncTotal = async (nextItems: QuoteItemRecord[]) => {
    const total = nextItems.reduce((sum, item) => sum + Number(item.qty ?? 0) * Number(item.unit_price ?? 0), 0);
    if (!quote) return;
    await nocobaseClient.action("crm_quotes", "update", { query: { filterByTk: quote.id }, body: { total } });
    await query.refetch();
  };
  const addItem = async () => {
    const selected = productOptions.find((option) => option.value === productId)?.product;
    if (!id || !selected || qty < 1) return;
    setSaving(true);
    try {
      const created = await nocobaseClient.action<QuoteItemRecord>("crm_quote_items", "create", {
        body: { quote: id, product: selected.id, product_name: selected.name, qty, unit_price: unitPrice },
      });
      await syncTotal([...items, created]);
      await itemsQuery.query.refetch();
      setProductId(null);
      setQty(1);
      setUnitPrice(0);
      open?.({ type: "success", message: translate("crm.quotes.items.added", { ns: "starter" }, "Line item added") });
    } catch (error) {
      open?.({ type: "error", message: translate("crm.quotes.items.addError", { ns: "starter" }, "Unable to add line item"), description: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  };
  const removeItem = async (item: QuoteItemRecord) => {
    try {
      await nocobaseClient.action("crm_quote_items", "destroy", { query: { filterByTk: item.id } });
      await syncTotal(items.filter((current) => current.id !== item.id));
      await itemsQuery.query.refetch();
    } catch (error) {
      open?.({ type: "error", message: translate("crm.quotes.items.deleteError", { ns: "starter" }, "Unable to remove line item"), description: error instanceof Error ? error.message : undefined });
    }
  };

  return (
    <CrmAIContext
      id="crm-quote-detail"
      title={translate("crm.ai.context.quote", { ns: "starter" }, "Quote detail")}
      getContext={() => ({
        resource: "crm_quotes",
        record: quote
          ? {
              id: quote.id,
              quote_number: quote.quote_number,
              status: quote.status,
              issue_date: quote.issue_date,
              valid_until: quote.valid_until,
              total: calculatedTotal,
              customer: quote.customer?.company_name ?? null,
              deal: quote.deal?.title ?? null,
            }
          : null,
        items: items.map((item) => ({
          product: item.product_name,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: Number(item.qty ?? 0) * Number(item.unit_price ?? 0),
        })),
      })}
    >
    <RouteDrawer
      title={quote?.quote_number ?? translate("crm.quotes.detail.title", { ns: "starter" }, "Quote details")}
      description={translate("crm.quotes.detail.description", { ns: "starter" }, "Commercial summary and priced line items.")}
      closeLabel={translate("crm.common.close", { ns: "starter" }, "Close")}
      closeTo={closeTo}
      actions={<CrmAIShortcut tasks={aiTasks} />}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {query.isLoading ? <LoadingState className="min-h-64" /> : quote ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent p-5">
              <div><p className="text-sm text-muted-foreground">{translate("crm.quotes.fields.total", { ns: "starter" }, "Quote total")}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{formatCurrency(calculatedTotal, locale)}</p></div>
              <EnumBadge value={quote.status} label={labelFor(QUOTE_STATUSES, quote.status, translate)} />
            </div>
            <DetailItems title={translate("crm.quotes.detail.summary", { ns: "starter" }, "Quote summary")} items={[
              [translate("crm.quotes.fields.customer", { ns: "starter" }, "Customer"), quote.customer?.company_name ?? "—"],
              [translate("crm.quotes.fields.deal", { ns: "starter" }, "Deal"), quote.deal?.title ?? "—"],
              [translate("crm.quotes.fields.issueDate", { ns: "starter" }, "Issue date"), formatDate(quote.issue_date, locale)],
              [translate("crm.quotes.fields.validUntil", { ns: "starter" }, "Valid until"), formatDate(quote.valid_until, locale)],
            ]} />
            <Separator />
            <DrawerSection title={translate("crm.quotes.items.title", { ns: "starter" }, "Line items")}>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{translate("crm.quotes.items.product", { ns: "starter" }, "Product")}</TableHead>
                    <TableHead className="text-right">{translate("crm.quotes.items.qty", { ns: "starter" }, "Qty")}</TableHead>
                    <TableHead className="text-right">{translate("crm.quotes.items.unitPrice", { ns: "starter" }, "Unit price")}</TableHead>
                    <TableHead className="text-right">{translate("crm.quotes.items.lineTotal", { ns: "starter" }, "Line total")}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow></TableHeader>
                  <TableBody>{items.map((item) => <TableRow key={String(item.id)}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.unit_price, locale)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(Number(item.qty ?? 0) * Number(item.unit_price ?? 0), locale)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => void removeItem(item)}><Trash2 /><span className="sr-only">{translate("crm.quotes.items.remove", { ns: "starter" }, "Remove line item")}</span></Button></TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </div>
              <div className="grid gap-3 rounded-xl border border-dashed bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_auto] sm:items-end">
                <div className="space-y-2"><Label>{translate("crm.quotes.items.product", { ns: "starter" }, "Product")}</Label><EntityPicker value={productId} onChange={selectProduct} options={productOptions} placeholder={translate("crm.quotes.items.selectProduct", { ns: "starter" }, "Select from price book")} /></div>
                <div className="space-y-2"><Label>{translate("crm.quotes.items.qty", { ns: "starter" }, "Qty")}</Label><Input type="number" min={1} value={qty} onChange={(event) => setQty(Math.max(1, Number(event.target.value)))} /></div>
                <div className="space-y-2"><Label>{translate("crm.quotes.items.unitPrice", { ns: "starter" }, "Unit price")}</Label><Input type="number" min={0} step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(Math.max(0, Number(event.target.value)))} /></div>
                <Button disabled={!productId || saving} onClick={() => void addItem()}><Plus />{saving ? translate("crm.quotes.items.adding", { ns: "starter" }, "Adding...") : translate("crm.quotes.items.add", { ns: "starter" }, "Add item")}</Button>
              </div>
            </DrawerSection>
          </div>
        ) : null}
      </div>
    </RouteDrawer>
    </CrmAIContext>
  );
}
