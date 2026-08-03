import { useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CanAccess } from "@/components/access-control/can-access";
import { AccessDenied } from "@/components/access-control/access-denied";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSorter } from "@/components/data-table/data-table-sorter";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { EditButton } from "@/components/resources/buttons/edit";
import { ListView } from "@/components/resources/views/list-view";
import { ACTIVITY_TYPES, formatDateTime, labelFor } from "../constants";
import {
  DEFAULT_PAGE_SIZE,
  ListDateRange,
  ListFilterSelect,
  ListSearchInput,
  ListToolbar,
  ListToolbarContent,
  dateTimeRangeFilter,
  searchFilter,
  useDebouncedValue,
  useResetPageOnFilterChange,
} from "../list-controls";
import { useCustomerOptions } from "../pickers";
import { EnumBadge, useLocale } from "../shared";
import type { ActivityRecord } from "../types";
import { useOpenContextualChild } from "../route-surfaces";

export function ActivitiesLayout() {
  return (
    <CanAccess resource="crm_activities" action="list" fallback={<AccessDenied />}>
      <ActivityList />
    </CanAccess>
  );
}

function ActivityList() {
  const translate = useTranslate();
  const openChild = useOpenContextualChild();
  const locale = useLocale();
  const { options: customerOptions } = useCustomerOptions();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [loggedFrom, setLoggedFrom] = useState("");
  const [loggedTo, setLoggedTo] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  // The top toolbar is the single filter entry point; column headers only sort.
  const permanentFilters = useMemo(
    () => [
      ...searchFilter(["subject", "notes"], debouncedSearch),
      ...(type === "all"
        ? []
        : [{ field: "type", operator: "eq" as const, value: type }]),
      ...(customer === "all"
        ? []
        : [{ field: "customer_id", operator: "eq" as const, value: customer }]),
      ...dateTimeRangeFilter("date", loggedFrom, loggedTo),
    ],
    [debouncedSearch, type, customer, loggedFrom, loggedTo]
  );

  const typeOptions = useMemo(
    () =>
      ACTIVITY_TYPES.map((type) => ({
        value: type.value,
        label: labelFor(ACTIVITY_TYPES, type.value, translate),
      })),
    [translate]
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<ActivityRecord>();
    return [
      columnHelper.accessor("date", {
        id: "date",
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.activities.fields.date", { ns: "starter" }, "Date")}
            </span>
            <DataTableSorter column={column} />
          </div>
        ),
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">
            {formatDateTime(getValue(), locale)}
          </span>
        ),
      }),
      columnHelper.accessor("type", {
        id: "type",
        header: translate("crm.activities.fields.type", { ns: "starter" }, "Type"),
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue() ?? "call";
          return <EnumBadge value={value} label={labelFor(ACTIVITY_TYPES, value, translate)} />;
        },
      }),
      columnHelper.accessor("subject", {
        id: "subject",
        header: translate("crm.activities.fields.subject", { ns: "starter" }, "Subject"),
        enableSorting: false,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor((record) => record.customer?.company_name, {
        id: "customer.id",
        header: translate("crm.activities.fields.customer", { ns: "starter" }, "Customer"),
        enableSorting: false,
        cell: ({ row }) => row.original.customer?.company_name || "—",
      }),
      columnHelper.accessor((record) => record.contact?.name, {
        id: "contactName",
        header: translate("crm.activities.fields.contact", { ns: "starter" }, "Contact"),
        enableSorting: false,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.display({
        id: "actions",
        header: translate("crm.common.actions", { ns: "starter" }, "Actions"),
        enableSorting: false,
        size: 96,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <EditButton
              resource="crm_activities"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              onClick={() => openChild(`edit/${row.original.id}`)}
            >
              <Pencil />
            </EditButton>
            <DeleteButton
              resource="crm_activities"
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
  }, [locale, openChild, translate]);

  const table = useTable<ActivityRecord>({
    columns,
    refineCoreProps: {
      resource: "crm_activities",
      syncWithLocation: false,
      meta: { appends: ["customer", "contact"] },
      pagination: { currentPage: 1, pageSize: DEFAULT_PAGE_SIZE },
      filters: { permanent: permanentFilters },
      sorters: { initial: [{ field: "date", order: "desc" }] },
    },
  });

  useResetPageOnFilterChange(
    `${debouncedSearch}|${type}|${customer}|${loggedFrom}|${loggedTo}`,
    table.refineCore.setCurrentPage
  );

  return (
    <ListView resource="crm_activities">
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListToolbarContent>
            <ListSearchInput
              value={search}
              onChange={setSearch}
              placeholder={translate("crm.activities.search", { ns: "starter" }, "Search subject or notes")}
            />
            <ListFilterSelect
              value={type}
              onChange={setType}
              options={typeOptions}
              allLabel={translate("crm.activities.allTypes", { ns: "starter" }, "All types")}
            />
            <ListFilterSelect
              value={customer}
              onChange={setCustomer}
              options={customerOptions}
              allLabel={translate("crm.common.allCustomers", { ns: "starter" }, "All customers")}
            />
            <ListDateRange
              from={loggedFrom}
              to={loggedTo}
              onFromChange={setLoggedFrom}
              onToChange={setLoggedTo}
              label={translate("crm.activities.fields.date", { ns: "starter" }, "Date")}
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
