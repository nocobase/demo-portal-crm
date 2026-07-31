import { useList, useShow, useTranslate, useUpdate } from "@refinedev/core";
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate, useOutlet, useParams } from "react-router";
import { LoadingState } from "@/components/app-shell/loading-state";
import { DeleteButton } from "@/components/resources/buttons/delete";
import { EditButton } from "@/components/resources/buttons/edit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteDrawer } from "@/extensions/nocobase-route-surfaces";
import {
  ACTIVITY_TYPES,
  DEAL_STAGES,
  FOLLOW_UP_STATUSES,
  INDUSTRIES,
  CUSTOMER_STATUSES,
  formatCurrency,
  formatDate,
  formatDateTime,
  labelFor,
} from "../constants";
import { crmRoutes, getCustomerNestedPath } from "../routes";
import { DetailItems, DrawerSection, EnumBadge, useLocale } from "../shared";
import type {
  ActivityRecord,
  ContactRecord,
  CustomerRecord,
  DealRecord,
  FollowUpRecord,
} from "../types";

export function CustomerShow() {
  const translate = useTranslate();
  const locale = useLocale();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const nested = useOutlet();
  const { result: record, query } = useShow<CustomerRecord>({
    resource: "crm_customers",
    id,
  });

  const displayName =
    record?.company_name ||
    translate("crm.customers.detail.unnamed", { ns: "app" }, "Unnamed customer");

  return (
    <RouteDrawer
      title={
        query.isLoading && !record ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          displayName
        )
      }
      description={translate(
        "crm.customers.drawer.show.description",
        { ns: "app" },
        "Contacts, deals, activity and follow-ups for this account."
      )}
      closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
      closeTo={crmRoutes.customers}
      nested={nested}
      actions={
        record ? (
          <EditButton
            resource="crm_customers"
            recordItemId={record.id}
            variant="outline"
            size="icon-sm"
            onClick={() => navigate("edit")}
          >
            <Pencil />
          </EditButton>
        ) : null
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {query.isLoading ? (
          <LoadingState className="min-h-64" />
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {translate("crm.customers.detail.loadError.title", { ns: "app" }, "Unable to load customer")}
            </AlertTitle>
            <AlertDescription>
              {translate(
                "crm.customers.detail.loadError.description",
                { ns: "app" },
                "The customer may no longer exist, or you may not have permission to view it."
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <DetailItems
              title={translate("crm.customers.detail.profile", { ns: "app" }, "Profile")}
              items={[
                [
                  translate("crm.customers.fields.industry", { ns: "app" }, "Industry"),
                  record?.industry ? labelFor(INDUSTRIES, record.industry) : "—",
                ],
                [
                  translate("crm.customers.fields.status", { ns: "app" }, "Status"),
                  <EnumBadge
                    key="status"
                    value={record?.status ?? "active"}
                    label={labelFor(CUSTOMER_STATUSES, record?.status ?? "active")}
                  />,
                ],
                [translate("crm.customers.fields.phone", { ns: "app" }, "Phone"), record?.phone || "—"],
                [
                  translate("crm.customers.fields.website", { ns: "app" }, "Website"),
                  record?.website ? (
                    <a
                      key="website"
                      href={record.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {record.website}
                    </a>
                  ) : (
                    "—"
                  ),
                ],
                [
                  translate("crm.customers.fields.createdAt", { ns: "app" }, "Customer since"),
                  formatDate(record?.createdAt, locale),
                ],
                [translate("crm.customers.fields.notes", { ns: "app" }, "Notes"), record?.notes || "—"],
              ]}
            />
            {id ? (
              <>
                <Separator />
                <ContactsSection customerId={id} />
                <Separator />
                <DealsSection customerId={id} locale={locale} />
                <Separator />
                <ActivitiesSection customerId={id} locale={locale} />
                <Separator />
                <FollowUpsSection customerId={id} locale={locale} />
              </>
            ) : null}
          </div>
        )}
      </div>
    </RouteDrawer>
  );
}

function AddLink({ to, label }: { to: string; label: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link to={to} />}
    >
      <Plus />
      {label}
    </Button>
  );
}

function RowEditLink({ to }: { to: string }) {
  return (
    <Button variant="ghost" size="icon" nativeButton={false} render={<Link to={to} />}>
      <Pencil />
    </Button>
  );
}

function SimpleTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
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
    <td colSpan={colSpan} className="px-3 py-6 text-center text-muted-foreground">
      {text}
    </td>
  </tr>
);

function ContactsSection({ customerId }: { customerId: string }) {
  const translate = useTranslate();
  const { result } = useList<ContactRecord>({
    resource: "crm_contacts",
    pagination: { mode: "server", currentPage: 1, pageSize: 50 },
    sorters: [{ field: "name", order: "asc" }],
    filters: [{ field: "customer_id", operator: "eq", value: customerId }],
    errorNotification: false,
    queryOptions: { retry: false },
  });

  return (
    <DrawerSection
      title={translate("crm.customers.detail.contacts", { ns: "app" }, "Contacts")}
      action={
        <AddLink
          to={getCustomerNestedPath(customerId, "contacts/create")}
          label={translate("crm.contacts.actions.add", { ns: "app" }, "Add contact")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.contacts.fields.name", { ns: "app" }, "Name"),
          translate("crm.contacts.fields.jobTitle", { ns: "app" }, "Job title"),
          translate("crm.contacts.fields.email", { ns: "app" }, "Email"),
          translate("crm.contacts.fields.phone", { ns: "app" }, "Phone"),
          translate("crm.common.actions", { ns: "app" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={5}
            text={translate(
              "crm.contacts.empty",
              { ns: "app" },
              "No contacts yet. Add the people you deal with here."
            )}
          />
        ) : (
          result.data.map((contact) => (
            <tr key={String(contact.id)}>
              <td className="px-3 py-2 font-medium">{contact.name || "—"}</td>
              <td className="px-3 py-2">{contact.job_title || "—"}</td>
              <td className="px-3 py-2">{contact.email || "—"}</td>
              <td className="px-3 py-2">{contact.phone || "—"}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <RowEditLink
                    to={getCustomerNestedPath(
                      customerId,
                      `contacts/edit/${encodeURIComponent(String(contact.id))}`
                    )}
                  />
                  <DeleteButton
                    resource="crm_contacts"
                    recordItemId={contact.id}
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

function DealsSection({
  customerId,
  locale,
}: {
  customerId: string;
  locale: string;
}) {
  const translate = useTranslate();
  const { result } = useList<DealRecord>({
    resource: "crm_deals",
    pagination: { mode: "server", currentPage: 1, pageSize: 50 },
    sorters: [{ field: "createdAt", order: "desc" }],
    filters: [{ field: "customer_id", operator: "eq", value: customerId }],
    errorNotification: false,
    queryOptions: { retry: false },
  });

  return (
    <DrawerSection
      title={translate("crm.customers.detail.deals", { ns: "app" }, "Deals")}
      action={
        <AddLink
          to={getCustomerNestedPath(customerId, "deals/create")}
          label={translate("crm.deals.actions.add", { ns: "app" }, "Add deal")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.deals.fields.title", { ns: "app" }, "Deal"),
          translate("crm.deals.fields.stage", { ns: "app" }, "Stage"),
          translate("crm.deals.fields.amount", { ns: "app" }, "Amount"),
          translate("crm.deals.fields.expectedClose", { ns: "app" }, "Expected close"),
          translate("crm.common.actions", { ns: "app" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={5}
            text={translate("crm.deals.empty", { ns: "app" }, "No deals for this account yet.")}
          />
        ) : (
          result.data.map((deal) => (
            <tr key={String(deal.id)}>
              <td className="px-3 py-2 font-medium">{deal.title || "—"}</td>
              <td className="px-3 py-2">
                <EnumBadge
                  value={deal.stage ?? "inquiry"}
                  label={labelFor(DEAL_STAGES, deal.stage ?? "inquiry")}
                />
              </td>
              <td className="px-3 py-2 tabular-nums">
                {formatCurrency(deal.amount, locale)}
              </td>
              <td className="px-3 py-2">
                {formatDate(deal.expected_close_date, locale)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <RowEditLink
                    to={getCustomerNestedPath(
                      customerId,
                      `deals/edit/${encodeURIComponent(String(deal.id))}`
                    )}
                  />
                  <DeleteButton
                    resource="crm_deals"
                    recordItemId={deal.id}
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

function ActivitiesSection({
  customerId,
  locale,
}: {
  customerId: string;
  locale: string;
}) {
  const translate = useTranslate();
  const { result } = useList<ActivityRecord>({
    resource: "crm_activities",
    pagination: { mode: "server", currentPage: 1, pageSize: 50 },
    sorters: [{ field: "date", order: "desc" }],
    filters: [{ field: "customer_id", operator: "eq", value: customerId }],
    errorNotification: false,
    queryOptions: { retry: false },
  });

  return (
    <DrawerSection
      title={translate("crm.customers.detail.activities", { ns: "app" }, "Activity log")}
      action={
        <AddLink
          to={getCustomerNestedPath(customerId, "activities/create")}
          label={translate("crm.activities.actions.add", { ns: "app" }, "Log activity")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.activities.fields.date", { ns: "app" }, "Date"),
          translate("crm.activities.fields.type", { ns: "app" }, "Type"),
          translate("crm.activities.fields.subject", { ns: "app" }, "Subject"),
          translate("crm.activities.fields.contact", { ns: "app" }, "Contact"),
          translate("crm.common.actions", { ns: "app" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={5}
            text={translate(
              "crm.activities.empty",
              { ns: "app" },
              "No calls, meetings or emails logged yet."
            )}
          />
        ) : (
          result.data.map((activity) => (
            <tr key={String(activity.id)}>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatDateTime(activity.date, locale)}
              </td>
              <td className="px-3 py-2">
                <EnumBadge
                  value={activity.type ?? "call"}
                  label={labelFor(ACTIVITY_TYPES, activity.type ?? "call")}
                />
              </td>
              <td className="px-3 py-2 font-medium">{activity.subject || "—"}</td>
              <td className="px-3 py-2">{activity.contact?.name || "—"}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <RowEditLink
                    to={getCustomerNestedPath(
                      customerId,
                      `activities/edit/${encodeURIComponent(String(activity.id))}`
                    )}
                  />
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

function FollowUpsSection({
  customerId,
  locale,
}: {
  customerId: string;
  locale: string;
}) {
  const translate = useTranslate();
  const { mutate: updateFollowUp } = useUpdate<FollowUpRecord>();
  const { result } = useList<FollowUpRecord>({
    resource: "crm_follow_ups",
    pagination: { mode: "server", currentPage: 1, pageSize: 50 },
    sorters: [{ field: "due_date", order: "asc" }],
    filters: [{ field: "customer_id", operator: "eq", value: customerId }],
    errorNotification: false,
    queryOptions: { retry: false },
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <DrawerSection
      title={translate("crm.customers.detail.followUps", { ns: "app" }, "Follow-ups")}
      action={
        <AddLink
          to={getCustomerNestedPath(customerId, "follow-ups/create")}
          label={translate("crm.followUps.actions.add", { ns: "app" }, "Add follow-up")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.followUps.fields.dueDate", { ns: "app" }, "Due"),
          translate("crm.followUps.fields.subject", { ns: "app" }, "Subject"),
          translate("crm.followUps.fields.status", { ns: "app" }, "Status"),
          translate("crm.common.actions", { ns: "app" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={4}
            text={translate(
              "crm.followUps.empty",
              { ns: "app" },
              "Nothing scheduled. Add a reminder so nothing slips."
            )}
          />
        ) : (
          result.data.map((followUp) => {
            const isDone = followUp.status === "done";
            const isOverdue =
              !isDone && (followUp.due_date ?? "") < today;
            return (
              <tr key={String(followUp.id)}>
                <td
                  className={
                    "px-3 py-2 whitespace-nowrap " +
                    (isOverdue ? "text-red-600 dark:text-red-400" : "")
                  }
                >
                  {formatDate(followUp.due_date, locale)}
                </td>
                <td className="px-3 py-2 font-medium">{followUp.subject || "—"}</td>
                <td className="px-3 py-2">
                  <EnumBadge
                    value={followUp.status ?? "pending"}
                    label={labelFor(FOLLOW_UP_STATUSES, followUp.status ?? "pending")}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {isDone ? (
                      <Circle className="size-4 text-muted-foreground/40" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={translate("crm.followUps.actions.markDone", { ns: "app" }, "Mark done")}
                        onClick={() =>
                          updateFollowUp({
                            resource: "crm_follow_ups",
                            id: followUp.id,
                            values: { status: "done" },
                          })
                        }
                      >
                        <CheckCircle2 />
                      </Button>
                    )}
                    <RowEditLink
                      to={getCustomerNestedPath(
                        customerId,
                        `follow-ups/edit/${encodeURIComponent(String(followUp.id))}`
                      )}
                    />
                    <DeleteButton
                      resource="crm_follow_ups"
                      recordItemId={followUp.id}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 />
                    </DeleteButton>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </SimpleTable>
    </DrawerSection>
  );
}
