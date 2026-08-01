import { useList, useShow, useTranslate, useUpdate } from "@refinedev/core";
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useOutlet, useParams } from "react-router";
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
import {
  useContextualCloseTo,
  useOpenContextualChild,
} from "../route-surfaces";
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
  const openChild = useOpenContextualChild();
  const closeTo = useContextualCloseTo();
  const { id } = useParams<{ id: string }>();
  const nested = useOutlet();
  const { result: record, query } = useShow<CustomerRecord>({
    resource: "crm_customers",
    id,
  });

  const displayName =
    record?.company_name ||
    translate("crm.customers.detail.unnamed", { ns: "starter" }, "Unnamed customer");

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
        { ns: "starter" },
        "Contacts, deals, activity and follow-ups for this account."
      )}
      closeLabel={translate("crm.common.close", { ns: "starter" }, "Close")}
      closeTo={closeTo}
      nested={nested}
      actions={
        record ? (
          <EditButton
            resource="crm_customers"
            recordItemId={record.id}
            variant="outline"
            size="icon-sm"
            onClick={() => openChild("edit")}
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
              {translate("crm.customers.detail.loadError.title", { ns: "starter" }, "Unable to load customer")}
            </AlertTitle>
            <AlertDescription>
              {translate(
                "crm.customers.detail.loadError.description",
                { ns: "starter" },
                "The customer may no longer exist, or you may not have permission to view it."
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <DetailItems
              title={translate("crm.customers.detail.profile", { ns: "starter" }, "Profile")}
              items={[
                [
                  translate("crm.customers.fields.industry", { ns: "starter" }, "Industry"),
                  record?.industry ? labelFor(INDUSTRIES, record.industry, translate) : "—",
                ],
                [
                  translate("crm.customers.fields.status", { ns: "starter" }, "Status"),
                  <EnumBadge
                    key="status"
                    value={record?.status ?? "active"}
                    label={labelFor(CUSTOMER_STATUSES, record?.status ?? "active", translate)}
                  />,
                ],
                [translate("crm.customers.fields.phone", { ns: "starter" }, "Phone"), record?.phone || "—"],
                [
                  translate("crm.customers.fields.website", { ns: "starter" }, "Website"),
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
                  translate("crm.customers.fields.createdAt", { ns: "starter" }, "Customer since"),
                  formatDate(record?.createdAt, locale),
                ],
                [translate("crm.customers.fields.notes", { ns: "starter" }, "Notes"), record?.notes || "—"],
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
  const openChild = useOpenContextualChild();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openChild(to)}
    >
      <Plus />
      {label}
    </Button>
  );
}

function RowEditLink({ to }: { to: string }) {
  const openChild = useOpenContextualChild();

  return (
    <Button variant="ghost" size="icon" onClick={() => openChild(to)}>
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
      title={translate("crm.customers.detail.contacts", { ns: "starter" }, "Contacts")}
      action={
        <AddLink
          to="contacts/create"
          label={translate("crm.contacts.actions.add", { ns: "starter" }, "Add contact")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.contacts.fields.name", { ns: "starter" }, "Name"),
          translate("crm.contacts.fields.jobTitle", { ns: "starter" }, "Job title"),
          translate("crm.contacts.fields.email", { ns: "starter" }, "Email"),
          translate("crm.contacts.fields.phone", { ns: "starter" }, "Phone"),
          translate("crm.common.actions", { ns: "starter" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={5}
            text={translate(
              "crm.contacts.empty",
              { ns: "starter" },
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
                    to={`contacts/edit/${encodeURIComponent(String(contact.id))}`}
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
      title={translate("crm.customers.detail.deals", { ns: "starter" }, "Deals")}
      action={
        <AddLink
          to="deals/create"
          label={translate("crm.deals.actions.add", { ns: "starter" }, "Add deal")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.deals.fields.title", { ns: "starter" }, "Deal"),
          translate("crm.deals.fields.stage", { ns: "starter" }, "Stage"),
          translate("crm.deals.fields.amount", { ns: "starter" }, "Amount"),
          translate("crm.deals.fields.expectedClose", { ns: "starter" }, "Expected close"),
          translate("crm.common.actions", { ns: "starter" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={5}
            text={translate("crm.deals.empty", { ns: "starter" }, "No deals for this account yet.")}
          />
        ) : (
          result.data.map((deal) => (
            <tr key={String(deal.id)}>
              <td className="px-3 py-2 font-medium">{deal.title || "—"}</td>
              <td className="px-3 py-2">
                <EnumBadge
                  value={deal.stage ?? "inquiry"}
                  label={labelFor(DEAL_STAGES, deal.stage ?? "inquiry", translate)}
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
                    to={`deals/edit/${encodeURIComponent(String(deal.id))}`}
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
      title={translate("crm.customers.detail.activities", { ns: "starter" }, "Activity log")}
      action={
        <AddLink
          to="activities/create"
          label={translate("crm.activities.actions.add", { ns: "starter" }, "Log activity")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.activities.fields.date", { ns: "starter" }, "Date"),
          translate("crm.activities.fields.type", { ns: "starter" }, "Type"),
          translate("crm.activities.fields.subject", { ns: "starter" }, "Subject"),
          translate("crm.activities.fields.contact", { ns: "starter" }, "Contact"),
          translate("crm.common.actions", { ns: "starter" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={5}
            text={translate(
              "crm.activities.empty",
              { ns: "starter" },
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
                  label={labelFor(ACTIVITY_TYPES, activity.type ?? "call", translate)}
                />
              </td>
              <td className="px-3 py-2 font-medium">{activity.subject || "—"}</td>
              <td className="px-3 py-2">{activity.contact?.name || "—"}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <RowEditLink
                    to={`activities/edit/${encodeURIComponent(String(activity.id))}`}
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
      title={translate("crm.customers.detail.followUps", { ns: "starter" }, "Follow-ups")}
      action={
        <AddLink
          to="follow-ups/create"
          label={translate("crm.followUps.actions.add", { ns: "starter" }, "Add follow-up")}
        />
      }
    >
      <SimpleTable
        headers={[
          translate("crm.followUps.fields.dueDate", { ns: "starter" }, "Due"),
          translate("crm.followUps.fields.subject", { ns: "starter" }, "Subject"),
          translate("crm.followUps.fields.status", { ns: "starter" }, "Status"),
          translate("crm.common.actions", { ns: "starter" }, "Actions"),
        ]}
      >
        {result.data.length === 0 ? (
          <EmptyRow
            colSpan={4}
            text={translate(
              "crm.followUps.empty",
              { ns: "starter" },
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
                    label={labelFor(FOLLOW_UP_STATUSES, followUp.status ?? "pending", translate)}
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
                        title={translate("crm.followUps.actions.markDone", { ns: "starter" }, "Mark done")}
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
                      to={`follow-ups/edit/${encodeURIComponent(String(followUp.id))}`}
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
