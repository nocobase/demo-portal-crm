import { useTranslate, useUpdate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CanAccess } from "@/components/access-control/can-access";
import { AccessDenied } from "@/components/access-control/access-denied";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSorter } from "@/components/data-table/data-table-sorter";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { EditButton } from "@/components/resources/buttons/edit";
import { ListView } from "@/components/resources/views/list-view";
import { Button } from "@/components/ui/button";
import { FOLLOW_UP_STATUSES, formatDate, labelFor } from "../constants";
import {
  DEFAULT_PAGE_SIZE,
  ListDateRange,
  ListFilterSelect,
  ListSearchInput,
  ListToolbar,
  ListToolbarContent,
  dateRangeFilter,
  searchFilter,
  useDebouncedValue,
  useResetPageOnFilterChange,
} from "../list-controls";
import { useCustomerOptions, useOwnerOptions } from "../pickers";
import { EnumBadge, useLocale } from "../shared";
import type { FollowUpRecord } from "../types";
import { useOpenContextualChild } from "../route-surfaces";

export function FollowUpsLayout() {
  return (
    <CanAccess resource="crm_follow_ups" action="list" fallback={<AccessDenied />}>
      <FollowUpList />
    </CanAccess>
  );
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function FollowUpList() {
  const translate = useTranslate();
  const openChild = useOpenContextualChild();
  const locale = useLocale();
  const { options: customerOptions } = useCustomerOptions();
  const { options: ownerOptions } = useOwnerOptions();
  const { mutate: updateFollowUp } = useUpdate<FollowUpRecord>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [owner, setOwner] = useState("all");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  // The top toolbar is the single filter entry point; column headers only sort.
  const permanentFilters = useMemo(
    () => [
      ...searchFilter(["subject", "notes"], debouncedSearch),
      ...(status === "all"
        ? []
        : [{ field: "status", operator: "eq" as const, value: status }]),
      ...(customer === "all"
        ? []
        : [{ field: "customer_id", operator: "eq" as const, value: customer }]),
      ...(owner === "all"
        ? []
        : [{ field: "ownerId", operator: "eq" as const, value: owner }]),
      ...dateRangeFilter("due_date", dueFrom, dueTo),
    ],
    [debouncedSearch, status, customer, owner, dueFrom, dueTo]
  );

  const statusOptions = useMemo(
    () =>
      FOLLOW_UP_STATUSES.map((status) => ({
        value: status.value,
        label: labelFor(FOLLOW_UP_STATUSES, status.value, translate),
      })),
    [translate]
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<FollowUpRecord>();
    const today = todayIso();
    return [
      columnHelper.accessor("due_date", {
        id: "due_date",
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.followUps.fields.dueDate", { ns: "starter" }, "Due")}
            </span>
            <DataTableSorter column={column} />
          </div>
        ),
        enableSorting: true,
        cell: ({ row, getValue }) => {
          const value = getValue();
          const overdue = row.original.status !== "done" && (value ?? "") < today;
          return (
            <span
              className={
                overdue
                  ? "font-medium whitespace-nowrap text-red-600 dark:text-red-400"
                  : "whitespace-nowrap"
              }
            >
              {formatDate(value, locale)}
              {overdue
                ? ` · ${translate("crm.followUps.overdue", { ns: "starter" }, "Overdue")}`
                : ""}
            </span>
          );
        },
      }),
      columnHelper.accessor("subject", {
        id: "subject",
        header: translate("crm.followUps.fields.subject", { ns: "starter" }, "Subject"),
        enableSorting: false,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor((record) => record.customer?.company_name, {
        id: "customer.id",
        header: translate("crm.followUps.fields.customer", { ns: "starter" }, "Customer"),
        enableSorting: false,
        cell: ({ row }) => row.original.customer?.company_name || "—",
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: translate("crm.followUps.fields.status", { ns: "starter" }, "Status"),
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue() ?? "pending";
          return (
            <EnumBadge
              value={value}
              label={labelFor(FOLLOW_UP_STATUSES, value, translate)}
            />
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: translate("crm.common.actions", { ns: "starter" }, "Actions"),
        enableSorting: false,
        size: 128,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.status !== "done" ? (
              <Button
                variant="ghost"
                size="icon"
                title={translate("crm.followUps.actions.markDone", { ns: "starter" }, "Mark done")}
                onClick={() =>
                  updateFollowUp({
                    resource: "crm_follow_ups",
                    id: row.original.id,
                    values: { status: "done" },
                  })
                }
              >
                <CheckCircle2 />
              </Button>
            ) : null}
            <EditButton
              resource="crm_follow_ups"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              onClick={() => openChild(`edit/${row.original.id}`)}
            >
              <Pencil />
            </EditButton>
            <DeleteButton
              resource="crm_follow_ups"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </DeleteButton>
          </div>
        ),
      }),
    ];
  }, [locale, openChild, translate, updateFollowUp]);

  const table = useTable<FollowUpRecord>({
    columns,
    refineCoreProps: {
      resource: "crm_follow_ups",
      syncWithLocation: false,
      meta: { appends: ["customer", "owner"] },
      pagination: { currentPage: 1, pageSize: DEFAULT_PAGE_SIZE },
      filters: { permanent: permanentFilters },
      sorters: { initial: [{ field: "due_date", order: "asc" }] },
    },
  });

  useResetPageOnFilterChange(
    `${debouncedSearch}|${status}|${customer}|${owner}|${dueFrom}|${dueTo}`,
    table.refineCore.setCurrentPage
  );

  return (
    <ListView resource="crm_follow_ups">
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListToolbarContent>
            <ListSearchInput
              value={search}
              onChange={setSearch}
              placeholder={translate("crm.followUps.search", { ns: "starter" }, "Search subject or notes")}
            />
            <ListFilterSelect
              value={status}
              onChange={setStatus}
              options={statusOptions}
              allLabel={translate("crm.followUps.allStatuses", { ns: "starter" }, "All statuses")}
            />
            <ListFilterSelect
              value={customer}
              onChange={setCustomer}
              options={customerOptions}
              allLabel={translate("crm.common.allCustomers", { ns: "starter" }, "All customers")}
            />
            <ListFilterSelect
              value={owner}
              onChange={setOwner}
              options={ownerOptions}
              allLabel={translate("crm.common.allOwners", { ns: "starter" }, "All owners")}
            />
            <ListDateRange
              from={dueFrom}
              to={dueTo}
              onFromChange={setDueFrom}
              onToChange={setDueTo}
              label={translate("crm.followUps.fields.dueDate", { ns: "starter" }, "Due")}
            />
          </ListToolbarContent>
        </ListToolbar>
      </div>
      <DataTable
        table={table}
        onRowClick={(record) => openChild(`show/${record.id}`)}
      />
    </ListView>
  );
}
