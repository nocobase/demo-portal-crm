import { useList, useNotification, useOne, useTranslate } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Eye, Gauge, Mail, Pencil, Phone, Sparkles, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { LoadingState } from "@/components/app-shell/loading-state";
import { ListView } from "@/components/resources/views/list-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RouteDrawer } from "@/extensions/nocobase-route-surfaces";
import { nocobaseClient } from "@nocobase/portal-sdk/client";
import {
  CrmAIContext,
  CrmAIShortcut,
  useLeadDetailTasks,
  useLeadListTasks,
} from "../ai-assistant";
import { LEAD_SOURCES, LEAD_STATUSES, formatDate, labelFor } from "../constants";
import {
  ListDateRange,
  ListFilterSelect,
  ListPagination,
  ListSearchInput,
  ListToolbar,
  ListToolbarContent,
  dateTimeRangeFilter,
  searchFilter,
  useDebouncedValue,
  useListPagination,
  useResetPageOnFilterChange,
} from "../list-controls";
import { MetricCard } from "../overview-cards";
import { useOwnerOptions } from "../pickers";
import { useContextualCloseTo, useOpenContextualChild } from "../route-surfaces";
import { DetailItems, EnumBadge, useLocale } from "../shared";
import type { CustomerRecord, DealRecord, LeadRecord } from "../types";

export function LeadsPage() {
  const translate = useTranslate();
  const openChild = useOpenContextualChild();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [owner, setOwner] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { currentPage, pageSize, setCurrentPage, setPageSize } =
    useListPagination();
  const { options: ownerOptions } = useOwnerOptions();

  const filters = useMemo(
    () => [
      ...searchFilter(["name", "company", "email"], debouncedSearch),
      ...(status === "all"
        ? []
        : [{ field: "status", operator: "eq" as const, value: status }]),
      ...(source === "all"
        ? []
        : [{ field: "source", operator: "eq" as const, value: source }]),
      ...(owner === "all"
        ? []
        : [{ field: "owner_id", operator: "eq" as const, value: owner }]),
      ...dateTimeRangeFilter("createdAt", createdFrom, createdTo),
    ],
    [debouncedSearch, owner, source, status, createdFrom, createdTo]
  );
  useResetPageOnFilterChange(
    `${debouncedSearch}|${status}|${source}|${owner}|${createdFrom}|${createdTo}`,
    setCurrentPage
  );

  const { result, query } = useList<LeadRecord>({
    resource: "crm_leads",
    filters,
    pagination: { mode: "server", currentPage, pageSize },
    sorters: [{ field: "score", order: "desc" }],
    meta: { appends: ["owner"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  // Metrics describe the whole funnel, so they stay independent of the
  // table's page and filter state.
  const summary = useList<LeadRecord>({
    resource: "crm_leads",
    pagination: { mode: "server", currentPage: 1, pageSize: 500 },
    meta: { fields: ["id", "status", "score"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const visible = result.data;
  const allLeads = summary.result.data;
  const averageScore = allLeads.length
    ? Math.round(allLeads.reduce((sum, lead) => sum + Number(lead.score ?? 0), 0) / allLeads.length)
    : 0;
  const qualified = allLeads.filter((lead) => ["qualified", "converted"].includes(lead.status ?? "")).length;
  const conversionRate = allLeads.length ? Math.round((allLeads.filter((lead) => lead.status === "converted").length / allLeads.length) * 100) : 0;

  const statusOptions = useMemo(
    () =>
      LEAD_STATUSES.map((option) => ({
        value: option.value,
        label: labelFor(LEAD_STATUSES, option.value, translate),
      })),
    [translate]
  );
  const sourceOptions = useMemo(
    () =>
      LEAD_SOURCES.map((option) => ({
        value: option.value,
        label: labelFor(LEAD_SOURCES, option.value, translate),
      })),
    [translate]
  );

  const aiTasks = useLeadListTasks(translate);

  return (
    <CrmAIContext
      id="crm-leads-list"
      title={translate("crm.ai.context.leads", { ns: "starter" }, "Lead list")}
      kind="record-list"
      getContext={() => ({
        resource: "crm_leads",
        filters: { search, status, source, owner, createdFrom, createdTo },
        total: result.total,
        rows: visible.map((lead) => ({
          id: lead.id,
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          score: lead.score,
          owner: lead.owner?.nickname ?? null,
        })),
      })}
    >
    <ListView resource="crm_leads">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={translate("crm.leads.metrics.total", { ns: "starter" }, "Total leads")} value={summary.result.total ?? allLeads.length} icon={<Users className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.leads.metrics.qualified", { ns: "starter" }, "Qualified pipeline")} value={qualified} icon={<Target className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.leads.metrics.averageScore", { ns: "starter" }, "Average score")} value={`${averageScore}/100`} icon={<Gauge className="size-5" />} loading={summary.query.isLoading} />
        <MetricCard label={translate("crm.leads.metrics.conversion", { ns: "starter" }, "Conversion rate")} value={`${conversionRate}%`} icon={<Sparkles className="size-5" />} loading={summary.query.isLoading} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListToolbarContent
            actions={
              <CrmAIShortcut
                tasks={aiTasks}
                label={translate("crm.ai.askAssistant", { ns: "starter" }, "Ask the CRM assistant")}
              />
            }
          >
            <ListSearchInput
              value={search}
              onChange={setSearch}
              placeholder={translate("crm.leads.search", { ns: "starter" }, "Search name, company or email")}
            />
            <ListFilterSelect
              value={status}
              onChange={setStatus}
              options={statusOptions}
              allLabel={translate("crm.leads.allStatuses", { ns: "starter" }, "All statuses")}
            />
            <ListFilterSelect
              value={source}
              onChange={setSource}
              options={sourceOptions}
              allLabel={translate("crm.leads.allSources", { ns: "starter" }, "All sources")}
            />
            <ListFilterSelect
              value={owner}
              onChange={setOwner}
              options={ownerOptions}
              allLabel={translate("crm.common.allOwners", { ns: "starter" }, "All owners")}
            />
            <ListDateRange
              from={createdFrom}
              to={createdTo}
              onFromChange={setCreatedFrom}
              onToChange={setCreatedTo}
              label={translate("crm.leads.fields.createdAt", { ns: "starter" }, "Created")}
            />
          </ListToolbarContent>
        </ListToolbar>
        {query.isLoading ? (
          <LoadingState className="min-h-96" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate("crm.leads.fields.lead", { ns: "starter" }, "Lead")}</TableHead>
                    <TableHead>{translate("crm.leads.fields.source", { ns: "starter" }, "Source")}</TableHead>
                    <TableHead>{translate("crm.leads.fields.status", { ns: "starter" }, "Status")}</TableHead>
                    <TableHead>{translate("crm.leads.fields.score", { ns: "starter" }, "Score")}</TableHead>
                    <TableHead>{translate("crm.leads.fields.owner", { ns: "starter" }, "Owner")}</TableHead>
                    <TableHead className="w-16"><span className="sr-only">{translate("crm.common.actions", { ns: "starter" }, "Actions")}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((lead) => (
                    <TableRow
                      key={String(lead.id)}
                      className="cursor-pointer"
                      onClick={() => openChild(`show/${lead.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.company}</div>
                      </TableCell>
                      <TableCell>{labelFor(LEAD_SOURCES, lead.source, translate)}</TableCell>
                      <TableCell><EnumBadge value={lead.status} label={labelFor(LEAD_STATUSES, lead.status, translate)} /></TableCell>
                      <TableCell>
                        <div className="flex min-w-28 items-center gap-2">
                          <Progress value={Number(lead.score ?? 0)} className="w-20" />
                          <span className="text-xs font-semibold tabular-nums">{lead.score ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.owner?.nickname ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); openChild(`show/${lead.id}`); }}>
                            <Eye /><span className="sr-only">{translate("crm.leads.actions.view", { ns: "starter" }, "View lead")}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); openChild(`edit/${lead.id}`); }}>
                            <Pencil /><span className="sr-only">{translate("crm.leads.actions.edit", { ns: "starter" }, "Edit lead")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visible.length === 0 ? (
                <p className="px-4 py-14 text-center text-sm text-muted-foreground">{translate("crm.leads.empty", { ns: "starter" }, "No leads match the current filters.")}</p>
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
    </CrmAIContext>
  );
}

export function LeadShow() {
  const { id } = useParams<{ id: string }>();
  const translate = useTranslate();
  const locale = useLocale();
  const closeTo = useContextualCloseTo();
  const { open } = useNotification();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const aiTasks = useLeadDetailTasks(translate);
  const { result: lead, query } = useOne<LeadRecord>({
    resource: "crm_leads",
    id,
    meta: { appends: ["owner"] },
    queryOptions: { enabled: Boolean(id), retry: false },
  });

  const convert = async () => {
    if (!lead || lead.status === "converted") return;
    setConverting(true);
    try {
      const customer = await nocobaseClient.action<CustomerRecord>("crm_customers", "create", {
        body: {
          company_name: lead.company || lead.name,
          phone: lead.phone || null,
          status: "active",
          notes: `Converted from lead ${lead.name}. Primary email: ${lead.email ?? "not provided"}.`,
          ownerId: lead.owner_id ?? null,
        },
      });
      await nocobaseClient.action<DealRecord>("crm_deals", "create", {
        body: {
          title: `${lead.company || lead.name} opportunity`,
          stage: "inquiry",
          amount: Math.max(Number(lead.score ?? 25), 25) * 1000,
          expected_close_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
          customer: customer.id,
          ownerId: lead.owner_id ?? null,
          notes: `Created from qualified lead ${lead.name}.`,
        },
      });
      await nocobaseClient.action<LeadRecord>("crm_leads", "update", {
        query: { filterByTk: lead.id },
        body: { status: "converted", score: 100 },
      });
      await query.refetch();
      await queryClient.invalidateQueries({ queryKey: ["crm"] });
      open?.({
        type: "success",
        message: translate("crm.leads.convert.success", { ns: "starter" }, "Lead converted"),
        description: translate("crm.leads.convert.successDescription", { ns: "starter" }, "A customer and an inquiry-stage deal were created."),
      });
      setConfirmOpen(false);
    } catch (error) {
      open?.({
        type: "error",
        message: translate("crm.leads.convert.error", { ns: "starter" }, "Conversion failed"),
        description: error instanceof Error ? error.message : translate("crm.common.tryAgain", { ns: "starter" }, "Please try again."),
      });
    } finally {
      setConverting(false);
    }
  };

  return (
    <CrmAIContext
      id="crm-lead-detail"
      title={translate("crm.ai.context.lead", { ns: "starter" }, "Lead detail")}
      getContext={() => ({
        resource: "crm_leads",
        record: lead
          ? {
              id: lead.id,
              name: lead.name,
              company: lead.company,
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              status: lead.status,
              score: lead.score,
              owner: lead.owner?.nickname ?? null,
              createdAt: lead.createdAt,
            }
          : null,
      })}
    >
      <RouteDrawer
        title={lead?.name ?? translate("crm.leads.detail.title", { ns: "starter" }, "Lead details")}
        description={translate("crm.leads.detail.description", { ns: "starter" }, "Qualification signals, contact details and conversion readiness.")}
        closeLabel={translate("crm.common.close", { ns: "starter" }, "Close")}
        closeTo={closeTo}
        actions={
          <div className="flex items-center gap-2">
            <CrmAIShortcut tasks={aiTasks} />
            {lead && lead.status !== "converted" && lead.status !== "unqualified" ? (
              <Button onClick={() => setConfirmOpen(true)}><Sparkles />{translate("crm.leads.actions.convert", { ns: "starter" }, "Convert")}</Button>
            ) : null}
          </div>
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {query.isLoading ? <LoadingState className="min-h-64" /> : lead ? (
            <div className="space-y-7">
              <div className="rounded-xl border bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{translate("crm.leads.fields.score", { ns: "starter" }, "Lead score")}</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{lead.score ?? 0}<span className="text-base text-muted-foreground">/100</span></p>
                  </div>
                  <EnumBadge value={lead.status} label={labelFor(LEAD_STATUSES, lead.status, translate)} />
                </div>
                <Progress value={Number(lead.score ?? 0)} className="mt-4" />
              </div>
              <DetailItems title={translate("crm.leads.detail.profile", { ns: "starter" }, "Lead profile")} items={[
                [translate("crm.leads.fields.company", { ns: "starter" }, "Company"), <span key="company" className="inline-flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" />{lead.company || "—"}</span>],
                [translate("crm.leads.fields.owner", { ns: "starter" }, "Owner"), lead.owner?.nickname || "—"],
                [translate("crm.leads.fields.email", { ns: "starter" }, "Email"), <span key="email" className="inline-flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{lead.email || "—"}</span>],
                [translate("crm.leads.fields.phone", { ns: "starter" }, "Phone"), <span key="phone" className="inline-flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{lead.phone || "—"}</span>],
                [translate("crm.leads.fields.source", { ns: "starter" }, "Source"), labelFor(LEAD_SOURCES, lead.source, translate)],
                [translate("crm.leads.fields.createdAt", { ns: "starter" }, "Created"), formatDate(lead.createdAt, locale)],
              ]} />
              <div className="rounded-xl border p-4">
                <h3 className="font-medium">{translate("crm.leads.scoring.title", { ns: "starter" }, "How scoring works")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{translate("crm.leads.scoring.description", { ns: "starter" }, "Company, email and phone completeness are combined with source quality and qualification status. The stored score is refreshed during conversion.")}</p>
              </div>
            </div>
          ) : null}
        </div>
      </RouteDrawer>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("crm.leads.convert.title", { ns: "starter" }, "Convert this lead?")}</AlertDialogTitle>
            <AlertDialogDescription>{translate("crm.leads.convert.description", { ns: "starter" }, "This creates a customer and a new inquiry-stage deal, then marks the lead as converted.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translate("crm.common.cancel", { ns: "starter" }, "Cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={converting} onClick={() => void convert()}>
              {converting ? translate("crm.leads.convert.converting", { ns: "starter" }, "Converting...") : <><ArrowRight />{translate("crm.leads.actions.convert", { ns: "starter" }, "Convert")}</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrmAIContext>
  );
}
