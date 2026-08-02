import { useTranslate, useUpdate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { FOLLOW_UP_STATUSES, formatDate, labelFor } from "../constants";
import { useCustomerOptions } from "../pickers";
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
  const { mutate: updateFollowUp } = useUpdate<FollowUpRecord>();

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
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.followUps.fields.subject", { ns: "starter" }, "Subject")}
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
              {translate("crm.followUps.fields.customer", { ns: "starter" }, "Customer")}
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
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>
              {translate("crm.followUps.fields.status", { ns: "starter" }, "Status")}
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
  }, [customerOptions, locale, openChild, statusOptions, translate, updateFollowUp]);

  const table = useTable<FollowUpRecord>({
    columns,
    refineCoreProps: {
      resource: "crm_follow_ups",
      syncWithLocation: false,
      meta: { appends: ["customer"] },
      sorters: { initial: [{ field: "due_date", order: "asc" }] },
    },
  });

  return (
    <ListView resource="crm_follow_ups">
      <DataTable
        table={table}
        onRowClick={(record) => openChild(`show/${record.id}`)}
      />
    </ListView>
  );
}
