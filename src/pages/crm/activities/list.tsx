import { useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CanAccess } from "@/components/access-control/can-access";
import { AccessDenied } from "@/components/access-control/access-denied";
import { DataTable } from "@/components/data-table/data-table";
import {
  DataTableFilterCombobox,
  DataTableFilterDropdownText,
} from "@/components/data-table/data-table-filter";
import { DataTableSorter } from "@/components/data-table/data-table-sorter";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { EditButton } from "@/components/resources/buttons/edit";
import { ListView } from "@/components/resources/views/list-view";
import { ACTIVITY_TYPES, formatDateTime, labelFor } from "../constants";
import {
  DEFAULT_PAGE_SIZE,
  ListDateRange,
  ListSearchInput,
  ListToolbar,
  dateRangeFilter,
  searchFilter,
  useDebouncedValue,
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
  const [loggedFrom, setLoggedFrom] = useState("");
  const [loggedTo, setLoggedTo] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  // Permanent filters sit alongside the per-column filters the header exposes.
  const permanentFilters = useMemo(
    () => [
      ...searchFilter(["subject", "notes"], debouncedSearch),
      ...dateRangeFilter(
        "date",
        loggedFrom ? `${loggedFrom}T00:00:00.000Z` : "",
        loggedTo ? `${loggedTo}T23:59:59.999Z` : ""
      ),
    ],
    [debouncedSearch, loggedFrom, loggedTo]
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
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.activities.fields.type", { ns: "starter" }, "Type")}
            </span>
            <DataTableFilterCombobox
              column={column}
              table={table}
              options={typeOptions}
              defaultOperator="eq"
              operators={["eq", "in"]}
            />
          </div>
        ),
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue() ?? "call";
          return <EnumBadge value={value} label={labelFor(ACTIVITY_TYPES, value, translate)} />;
        },
      }),
      columnHelper.accessor("subject", {
        id: "subject",
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.activities.fields.subject", { ns: "starter" }, "Subject")}
            </span>
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              operators={["contains", "eq"]}
            />
          </div>
        ),
        enableSorting: false,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor((record) => record.customer?.company_name, {
        id: "customer.id",
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.activities.fields.customer", { ns: "starter" }, "Customer")}
            </span>
            <DataTableFilterCombobox
              column={column}
              table={table}
              options={customerOptions}
              defaultOperator="eq"
              operators={["eq"]}
            />
          </div>
        ),
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
  }, [customerOptions, locale, openChild, typeOptions, translate]);

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

  return (
    <ListView resource="crm_activities">
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListSearchInput
            value={search}
            onChange={setSearch}
            placeholder={translate("crm.activities.search", { ns: "starter" }, "Search subject or notes")}
          />
          <ListDateRange
            from={loggedFrom}
            to={loggedTo}
            onFromChange={setLoggedFrom}
            onToChange={setLoggedTo}
            label={translate("crm.activities.fields.date", { ns: "starter" }, "Date")}
          />
        </ListToolbar>
      </div>
      <DataTable
        table={table}
        onRowClick={(record) => openChild(`show/${record.id}`)}
      />
    </ListView>
  );
}
