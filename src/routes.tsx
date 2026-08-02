import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Package,
  Target,
  UserPlus,
  Workflow,
} from "lucide-react";
import { useParams } from "react-router";

import {
  defineAppRoutes,
  type AppRouteDefinition,
} from "@nocobase/portal-sdk/routing";
import { AccessDenied } from "@/components/access-control/access-denied";
import { CanAccess } from "@/components/access-control/can-access";
import { ActivityCreate, ActivityEdit } from "@/pages/crm/activities/form";
import { ActivitiesLayout } from "@/pages/crm/activities/list";
import { ContactCreate, ContactEdit } from "@/pages/crm/contacts/form";
import {
  CustomerCreate,
  CustomerEdit,
} from "@/pages/crm/customers/create-edit";
import { CustomersLayout } from "@/pages/crm/customers/list";
import { CustomerShow } from "@/pages/crm/customers/show";
import { DashboardPage } from "@/pages/crm/dashboard";
import { DealCreate, DealEdit } from "@/pages/crm/deals/form";
import { PipelinePage } from "@/pages/crm/deals/pipeline";
import { FollowUpCreate, FollowUpEdit } from "@/pages/crm/follow-ups/form";
import { FollowUpsLayout } from "@/pages/crm/follow-ups/list";
import { LeadShow, LeadsPage } from "@/pages/crm/leads/list";
import { ProductsPage } from "@/pages/crm/products/list";
import { QuoteShow, QuotesPage } from "@/pages/crm/quotes/list";
import { ReportsPage } from "@/pages/crm/reports/page";
import { crmRoutes } from "@/pages/crm/routes";
import { TargetsPage } from "@/pages/crm/targets/page";

export const registryRoutesEnabled = false;

function CustomerNestedDealCreate() {
  const { id } = useParams<{ id: string }>();
  return <DealCreate presetCustomerId={id} />;
}

function CustomerNestedDealEdit() {
  const { id } = useParams<{ id: string }>();
  return <DealEdit presetCustomerId={id} idParam="dealId" />;
}

function CustomerNestedActivityCreate() {
  const { id } = useParams<{ id: string }>();
  return <ActivityCreate presetCustomerId={id} />;
}

function CustomerNestedActivityEdit() {
  const { id } = useParams<{ id: string }>();
  return <ActivityEdit presetCustomerId={id} idParam="activityId" />;
}

function CustomerNestedFollowUpCreate() {
  const { id } = useParams<{ id: string }>();
  return <FollowUpCreate presetCustomerId={id} />;
}

function CustomerNestedFollowUpEdit() {
  const { id } = useParams<{ id: string }>();
  return <FollowUpEdit presetCustomerId={id} idParam="followUpId" />;
}

const denied = <AccessDenied />;

const customerContextChildren = (
  prefix: string
): AppRouteDefinition[] => [
  {
    name: `${prefix}.edit`,
    path: "edit",
    element: (
      <CanAccess resource="crm_customers" action="edit" fallback={denied}>
        <CustomerEdit />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.contacts.create`,
    path: "contacts/create",
    element: (
      <CanAccess resource="crm_contacts" action="create" fallback={denied}>
        <ContactCreate />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.contacts.edit`,
    path: "contacts/edit/:contactId",
    element: (
      <CanAccess resource="crm_contacts" action="edit" fallback={denied}>
        <ContactEdit />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.deals.create`,
    path: "deals/create",
    element: (
      <CanAccess resource="crm_deals" action="create" fallback={denied}>
        <CustomerNestedDealCreate />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.deals.edit`,
    path: "deals/edit/:dealId",
    element: (
      <CanAccess resource="crm_deals" action="edit" fallback={denied}>
        <CustomerNestedDealEdit />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.activities.create`,
    path: "activities/create",
    element: (
      <CanAccess resource="crm_activities" action="create" fallback={denied}>
        <CustomerNestedActivityCreate />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.activities.edit`,
    path: "activities/edit/:activityId",
    element: (
      <CanAccess resource="crm_activities" action="edit" fallback={denied}>
        <CustomerNestedActivityEdit />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.followUps.create`,
    path: "follow-ups/create",
    element: (
      <CanAccess resource="crm_follow_ups" action="create" fallback={denied}>
        <CustomerNestedFollowUpCreate />
      </CanAccess>
    ),
  },
  {
    name: `${prefix}.followUps.edit`,
    path: "follow-ups/edit/:followUpId",
    element: (
      <CanAccess resource="crm_follow_ups" action="edit" fallback={denied}>
        <CustomerNestedFollowUpEdit />
      </CanAccess>
    ),
  },
];

export const appRoutes = defineAppRoutes([
  {
    name: "dashboard",
    path: crmRoutes.dashboard,
    element: <DashboardPage />,
    resource: {
      meta: {
        label: "Dashboard",
        i18nKey: "crm.resources.dashboard",
        i18nOptions: { ns: "starter" },
        priority: 0,
        icon: <LayoutDashboard />,
        acl: false,
      },
    },
    children: [
      {
        name: "dashboard.deal.edit",
        path: "deals/edit/:id",
        element: (
          <CanAccess resource="crm_deals" action="edit" fallback={denied}>
            <DealEdit />
          </CanAccess>
        ),
      },
      {
        name: "dashboard.customer.show",
        path: "customers/show/:id",
        element: (
          <CanAccess resource="crm_customers" action="show" fallback={denied}>
            <CustomerShow />
          </CanAccess>
        ),
        children: customerContextChildren("dashboard.customer.show"),
      },
      {
        name: "dashboard.followUp.edit",
        path: "follow-ups/edit/:id",
        element: (
          <CanAccess resource="crm_follow_ups" action="edit" fallback={denied}>
            <FollowUpEdit />
          </CanAccess>
        ),
      },
    ],
  },
  {
    name: "crm_leads",
    path: crmRoutes.leads,
    element: (
      <CanAccess resource="crm_leads" action="list" fallback={denied}>
        <LeadsPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "Leads",
        singularLabel: "Lead",
        i18nKey: "crm.resources.leads",
        i18nSingularKey: "crm.resources.lead",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.leads.description",
        priority: 5,
        icon: <UserPlus />,
        description: "Score, qualify and convert inbound demand.",
        acl: { type: "collection" },
      },
    },
    children: [
      {
        name: "crm_leads.show",
        path: "show/:id",
        resourceAction: "show",
        element: (
          <CanAccess resource="crm_leads" action="show" fallback={denied}>
            <LeadShow />
          </CanAccess>
        ),
      },
    ],
  },
  {
    name: "crm_deals",
    path: crmRoutes.pipeline,
    element: (
      <CanAccess resource="crm_deals" action="list" fallback={denied}>
        <PipelinePage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "Pipeline",
        singularLabel: "Deal",
        i18nKey: "crm.resources.pipeline",
        i18nSingularKey: "crm.resources.deal",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.pipeline.description",
        priority: 10,
        icon: <Workflow />,
        description: "Every deal from inquiry to quote to won / lost.",
        canCreate: true,
        acl: { type: "collection" },
      },
    },
    children: [
      {
        name: "crm_deals.create",
        path: "create",
        resourceAction: "create",
        element: (
          <CanAccess resource="crm_deals" action="create" fallback={denied}>
            <DealCreate />
          </CanAccess>
        ),
      },
      {
        name: "crm_deals.edit",
        path: "edit/:id",
        resourceAction: "edit",
        element: (
          <CanAccess resource="crm_deals" action="edit" fallback={denied}>
            <DealEdit />
          </CanAccess>
        ),
      },
    ],
  },
  {
    name: "crm_quotes",
    path: crmRoutes.quotes,
    element: (
      <CanAccess resource="crm_quotes" action="list" fallback={denied}>
        <QuotesPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "Quotes",
        singularLabel: "Quote",
        i18nKey: "crm.resources.quotes",
        i18nSingularKey: "crm.resources.quote",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.quotes.description",
        priority: 15,
        icon: <FileText />,
        description: "Commercial proposals with priced line items.",
        acl: { type: "collection" },
      },
    },
    children: [
      {
        name: "crm_quotes.show",
        path: "show/:id",
        resourceAction: "show",
        element: (
          <CanAccess resource="crm_quotes" action="show" fallback={denied}>
            <QuoteShow />
          </CanAccess>
        ),
      },
    ],
  },
  {
    name: "crm_customers",
    path: crmRoutes.customers,
    element: <CustomersLayout />,
    resource: {
      meta: {
        label: "Customers",
        singularLabel: "Customer",
        i18nKey: "crm.resources.customers",
        i18nSingularKey: "crm.resources.customer",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.customers.description",
        priority: 20,
        icon: <Building2 />,
        description: "Client companies and the people you deal with.",
        canCreate: true,
        canDelete: true,
        acl: { type: "collection" },
      },
    },
    children: [
      {
        name: "crm_customers.create",
        path: "create",
        resourceAction: "create",
        element: (
          <CanAccess resource="crm_customers" action="create" fallback={denied}>
            <CustomerCreate />
          </CanAccess>
        ),
      },
      {
        name: "crm_customers.edit",
        path: "edit/:id",
        resourceAction: "edit",
        element: (
          <CanAccess resource="crm_customers" action="edit" fallback={denied}>
            <CustomerEdit />
          </CanAccess>
        ),
      },
      {
        name: "crm_customers.show",
        path: "show/:id",
        resourceAction: "show",
        element: (
          <CanAccess resource="crm_customers" action="show" fallback={denied}>
            <CustomerShow />
          </CanAccess>
        ),
        children: customerContextChildren("crm_customers.show"),
      },
    ],
  },
  {
    name: "crm_products",
    path: crmRoutes.products,
    element: (
      <CanAccess resource="crm_products" action="list" fallback={denied}>
        <ProductsPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "Products",
        singularLabel: "Product",
        i18nKey: "crm.resources.products",
        i18nSingularKey: "crm.resources.product",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.products.description",
        priority: 25,
        icon: <Package />,
        description: "Active SKUs and list prices used in quotes.",
        acl: { type: "collection" },
      },
    },
  },
  {
    name: "crm_activities",
    path: crmRoutes.activities,
    element: <ActivitiesLayout />,
    resource: {
      meta: {
        label: "Activities",
        singularLabel: "Activity",
        i18nKey: "crm.resources.activities",
        i18nSingularKey: "crm.resources.activity",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.activities.description",
        priority: 30,
        icon: <Activity />,
        description: "Calls, meetings and emails logged against customers.",
        canCreate: true,
        acl: { type: "collection" },
      },
    },
    children: [
      {
        name: "crm_activities.create",
        path: "create",
        resourceAction: "create",
        element: (
          <CanAccess resource="crm_activities" action="create" fallback={denied}>
            <ActivityCreate />
          </CanAccess>
        ),
      },
      {
        name: "crm_activities.edit",
        path: "edit/:id",
        resourceAction: "edit",
        element: (
          <CanAccess resource="crm_activities" action="edit" fallback={denied}>
            <ActivityEdit />
          </CanAccess>
        ),
      },
    ],
  },
  {
    name: "crm_follow_ups",
    path: crmRoutes.followUps,
    element: <FollowUpsLayout />,
    resource: {
      meta: {
        label: "Follow-ups",
        singularLabel: "Follow-up",
        i18nKey: "crm.resources.followUps",
        i18nSingularKey: "crm.resources.followUp",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.followUps.description",
        priority: 40,
        icon: <CalendarClock />,
        description: "Reminders so nothing slips.",
        canCreate: true,
        acl: { type: "collection" },
      },
    },
    children: [
      {
        name: "crm_follow_ups.create",
        path: "create",
        resourceAction: "create",
        element: (
          <CanAccess resource="crm_follow_ups" action="create" fallback={denied}>
            <FollowUpCreate />
          </CanAccess>
        ),
      },
      {
        name: "crm_follow_ups.edit",
        path: "edit/:id",
        resourceAction: "edit",
        element: (
          <CanAccess resource="crm_follow_ups" action="edit" fallback={denied}>
            <FollowUpEdit />
          </CanAccess>
        ),
      },
    ],
  },
  {
    name: "crm_targets",
    path: crmRoutes.targets,
    element: (
      <CanAccess resource="crm_targets" action="list" fallback={denied}>
        <TargetsPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "Targets",
        i18nKey: "crm.resources.targets",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.targets.description",
        priority: 50,
        icon: <Target />,
        description: "Monthly quotas, attainment and owner rankings.",
        acl: { type: "collection" },
      },
    },
  },
  {
    name: "crm_reports",
    path: crmRoutes.reports,
    element: (
      <CanAccess resource="crm_deals" action="list" fallback={denied}>
        <ReportsPage />
      </CanAccess>
    ),
    resource: {
      meta: {
        label: "Reports",
        i18nKey: "crm.resources.reports",
        i18nOptions: { ns: "starter" },
        descriptionI18nKey: "crm.resources.reports.description",
        priority: 60,
        icon: <BarChart3 />,
        description: "Pivot views of pipeline ownership and won revenue.",
        acl: false,
      },
    },
  },
]);
