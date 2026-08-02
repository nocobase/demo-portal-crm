import { useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
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
import { ShowButton } from "@/components/resources/buttons/show";
import { ListView } from "@/components/resources/views/list-view";
import { CUSTOMER_STATUSES, INDUSTRIES, labelFor } from "../constants";
import {
  DEFAULT_PAGE_SIZE,
  ListFilterSelect,
  ListSearchInput,
  ListToolbar,
  searchFilter,
  useDebouncedValue,
} from "../list-controls";
import { useOwnerOptions } from "../pickers";
import { EnumBadge } from "../shared";
import type { CustomerRecord } from "../types";
import { useOpenContextualChild } from "../route-surfaces";

export function CustomersLayout() {
  return (
    <CanAccess resource="crm_customers" action="list" fallback={<AccessDenied />}>
      <CustomerList />
    </CanAccess>
  );
}

function CustomerList() {
  const translate = useTranslate();
  const openChild = useOpenContextualChild();
  const { options: ownerOptions } = useOwnerOptions();
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const debouncedSearch = useDebouncedValue(search);

  // Permanent filters sit alongside the per-column filters the header exposes.
  const permanentFilters = useMemo(
    () => [
      ...searchFilter(["company_name", "phone", "website"], debouncedSearch),
      ...(owner === "all"
        ? []
        : [{ field: "ownerId", operator: "eq" as const, value: owner }]),
    ],
    [debouncedSearch, owner]
  );

  const industryOptions = useMemo(
    () =>
      INDUSTRIES.map((industry) => ({
        value: industry.value,
        label: labelFor(INDUSTRIES, industry.value, translate),
      })),
    [translate]
  );
  const statusOptions = useMemo(
    () =>
      CUSTOMER_STATUSES.map((status) => ({
        value: status.value,
        label: labelFor(CUSTOMER_STATUSES, status.value, translate),
      })),
    [translate]
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<CustomerRecord>();
    return [
      columnHelper.accessor("company_name", {
        id: "company_name",
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.customers.fields.companyName", { ns: "starter" }, "Company name")}
            </span>
            <DataTableSorter column={column} />
            <DataTableFilterDropdownText
              column={column}
              table={table}
              defaultOperator="contains"
              operators={["contains", "eq", "startswith"]}
            />
          </div>
        ),
        enableSorting: true,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor("industry", {
        id: "industry",
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.customers.fields.industry", { ns: "starter" }, "Industry")}
            </span>
            <DataTableFilterCombobox
              column={column}
              table={table}
              options={industryOptions}
              defaultOperator="eq"
              operators={["eq", "in"]}
            />
          </div>
        ),
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <EnumBadge value={value} label={labelFor(INDUSTRIES, value, translate)} />
          ) : (
            "—"
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.customers.fields.status", { ns: "starter" }, "Status")}
            </span>
            <DataTableFilterCombobox
              column={column}
              table={table}
              options={statusOptions}
              defaultOperator="eq"
              operators={["eq"]}
            />
          </div>
        ),
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue() ?? "active";
          return (
            <EnumBadge value={value} label={labelFor(CUSTOMER_STATUSES, value, translate)} />
          );
        },
      }),
      columnHelper.accessor("phone", {
        id: "phone",
        header: translate("crm.customers.fields.phone", { ns: "starter" }, "Phone"),
        enableSorting: false,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor((record) => record.owner?.nickname, {
        id: "ownerName",
        header: translate("crm.customers.fields.owner", { ns: "starter" }, "Account owner"),
        enableSorting: false,
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.display({
        id: "actions",
        header: translate("crm.common.actions", { ns: "starter" }, "Actions"),
        enableSorting: false,
        size: 144,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ShowButton
              resource="crm_customers"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              onClick={() => openChild(`show/${row.original.id}`)}
            >
              <Eye />
            </ShowButton>
            <EditButton
              resource="crm_customers"
              recordItemId={row.original.id}
              variant="ghost"
              size="icon"
              onClick={() => openChild(`edit/${row.original.id}`)}
            >
              <Pencil />
            </EditButton>
            <DeleteButton
              resource="crm_customers"
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
  }, [industryOptions, openChild, statusOptions, translate]);

  const table = useTable<CustomerRecord>({
    columns,
    refineCoreProps: {
      resource: "crm_customers",
      syncWithLocation: false,
      meta: { appends: ["owner"] },
      pagination: { currentPage: 1, pageSize: DEFAULT_PAGE_SIZE },
      filters: { permanent: permanentFilters },
      sorters: { initial: [{ field: "company_name", order: "asc" }] },
    },
  });

  return (
    <ListView resource="crm_customers">
      <div className="rounded-xl border bg-card shadow-sm">
        <ListToolbar>
          <ListSearchInput
            value={search}
            onChange={setSearch}
            placeholder={translate("crm.customers.search", { ns: "starter" }, "Search company, phone or website")}
          />
          <ListFilterSelect
            value={owner}
            onChange={setOwner}
            options={ownerOptions}
            allLabel={translate("crm.common.allOwners", { ns: "starter" }, "All owners")}
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
