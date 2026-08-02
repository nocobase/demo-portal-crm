import { useList, useNotification, useOne, useTranslate } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Eye, Gauge, Mail, Phone, Sparkles, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Outlet, useParams } from "react-router";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LEAD_SOURCES, LEAD_STATUSES, formatDate, labelFor } from "../constants";
import { MetricCard } from "../overview-cards";
import { useContextualCloseTo, useOpenContextualChild } from "../route-surfaces";
import { DetailItems, EnumBadge, useLocale } from "../shared";
import type { CustomerRecord, DealRecord, LeadRecord } from "../types";

export function LeadsPage() {
  const translate = useTranslate();
  const openChild = useOpenContextualChild();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { result, query } = useList<LeadRecord>({
    resource: "crm_leads",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
    sorters: [{ field: "score", order: "desc" }],
    meta: { appends: ["owner"] },
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const leads = result.data;
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = status === "all" || lead.status === status;
      const matchesSearch = !needle || [lead.name, lead.company, lead.email]
        .some((value) => value?.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [leads, search, status]);
  const averageScore = leads.length
    ? Math.round(leads.reduce((sum, lead) => sum + Number(lead.score ?? 0), 0) / leads.length)
    : 0;
  const qualified = leads.filter((lead) => ["qualified", "converted"].includes(lead.status ?? "")).length;
  const conversionRate = leads.length ? Math.round((leads.filter((lead) => lead.status === "converted").length / leads.length) * 100) : 0;

  return (
    <ListView resource="crm_leads">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={translate("crm.leads.metrics.total", { ns: "starter" }, "Total leads")} value={leads.length} icon={<Users className="size-5" />} loading={query.isLoading} />
        <MetricCard label={translate("crm.leads.metrics.qualified", { ns: "starter" }, "Qualified pipeline")} value={qualified} icon={<Target className="size-5" />} loading={query.isLoading} />
        <MetricCard label={translate("crm.leads.metrics.averageScore", { ns: "starter" }, "Average score")} value={`${averageScore}/100`} icon={<Gauge className="size-5" />} loading={query.isLoading} />
        <MetricCard label={translate("crm.leads.metrics.conversion", { ns: "starter" }, "Conversion rate")} value={`${conversionRate}%`} icon={<Sparkles className="size-5" />} loading={query.isLoading} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={translate("crm.leads.search", { ns: "starter" }, "Search name, company or email")}
            className="sm:max-w-sm"
          />
          <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue>
                {status === "all"
                  ? translate("crm.leads.allStatuses", { ns: "starter" }, "All statuses")
                  : labelFor(LEAD_STATUSES, status, translate)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("crm.leads.allStatuses", { ns: "starter" }, "All statuses")}</SelectItem>
              {LEAD_STATUSES.map((option) => (
                <SelectItem key={option.value} value={option.value}>{labelFor(LEAD_STATUSES, option.value, translate)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {query.isLoading ? (
          <LoadingState className="min-h-96" />
        ) : (
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
                  <TableRow key={String(lead.id)}>
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
                      <Button variant="ghost" size="icon" onClick={() => openChild(`show/${lead.id}`)}>
                        <Eye /><span className="sr-only">{translate("crm.leads.actions.view", { ns: "starter" }, "View lead")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {visible.length === 0 ? (
              <p className="px-4 py-14 text-center text-sm text-muted-foreground">{translate("crm.leads.empty", { ns: "starter" }, "No leads match the current filters.")}</p>
            ) : null}
          </div>
        )}
      </div>
      <Outlet />
    </ListView>
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
    <>
      <RouteDrawer
        title={lead?.name ?? translate("crm.leads.detail.title", { ns: "starter" }, "Lead details")}
        description={translate("crm.leads.detail.description", { ns: "starter" }, "Qualification signals, contact details and conversion readiness.")}
        closeLabel={translate("crm.common.close", { ns: "starter" }, "Close")}
        closeTo={closeTo}
        actions={lead && lead.status !== "converted" && lead.status !== "unqualified" ? (
          <Button onClick={() => setConfirmOpen(true)}><Sparkles />{translate("crm.leads.actions.convert", { ns: "starter" }, "Convert")}</Button>
        ) : null}
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
    </>
  );
}
