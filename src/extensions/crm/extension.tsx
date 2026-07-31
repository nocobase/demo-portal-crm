import {
  Activity,
  Building2,
  CalendarClock,
  LayoutDashboard,
  Workflow,
} from "lucide-react";
import { Route, useParams } from "react-router";
import type { AppExtension } from "@/app/extension";
import { AccessDenied } from "@/components/access-control/access-denied";
import { CanAccess } from "@/components/access-control/can-access";
import { ActivityCreate, ActivityEdit } from "./activities/form";
import { ActivitiesLayout } from "./activities/list";
import { ContactCreate, ContactEdit } from "./contacts/form";
import { CustomerCreate, CustomerEdit } from "./customers/create-edit";
import { CustomersLayout } from "./customers/list";
import { CustomerShow } from "./customers/show";
import { DashboardPage } from "./dashboard";
import { DealCreate, DealEdit } from "./deals/form";
import { PipelinePage } from "./deals/pipeline";
import { FollowUpCreate, FollowUpEdit } from "./follow-ups/form";
import { FollowUpsLayout } from "./follow-ups/list";
import { crmRoutes } from "./routes";

function useNestedCustomerId() {
  return useParams<{ id: string }>();
}

function CustomerNestedDealCreate() {
  const { id } = useNestedCustomerId();
  return <DealCreate presetCustomerId={id} />;
}

function CustomerNestedDealEdit() {
  const { id } = useNestedCustomerId();
  return <DealEdit presetCustomerId={id} idParam="dealId" />;
}

function CustomerNestedActivityCreate() {
  const { id } = useNestedCustomerId();
  return <ActivityCreate presetCustomerId={id} />;
}

function CustomerNestedActivityEdit() {
  const { id } = useNestedCustomerId();
  return <ActivityEdit presetCustomerId={id} idParam="activityId" />;
}

function CustomerNestedFollowUpCreate() {
  const { id } = useNestedCustomerId();
  return <FollowUpCreate presetCustomerId={id} />;
}

function CustomerNestedFollowUpEdit() {
  const { id } = useNestedCustomerId();
  return <FollowUpEdit presetCustomerId={id} idParam="followUpId" />;
}

const crmExtension: AppExtension = {
  id: "crm",
  priority: 0,
  resources: [
    {
      name: "dashboard",
      list: crmRoutes.dashboard,
      meta: {
        label: "Dashboard",
        priority: 0,
        icon: <LayoutDashboard />,
        acl: false,
      },
    },
    {
      name: "crm_deals",
      list: crmRoutes.pipeline,
      create: crmRoutes.dealsCreate,
      edit: crmRoutes.dealsEdit,
      meta: {
        label: "Pipeline",
        singularLabel: "Deal",
        priority: 10,
        icon: <Workflow />,
        description: "Every deal from inquiry to quote to won / lost.",
        canCreate: true,
        acl: { type: "collection" },
      },
    },
    {
      name: "crm_customers",
      list: crmRoutes.customers,
      create: crmRoutes.customersCreate,
      edit: crmRoutes.customersEdit,
      show: crmRoutes.customersShow,
      meta: {
        label: "Customers",
        singularLabel: "Customer",
        priority: 20,
        icon: <Building2 />,
        description: "Client companies and the people you deal with.",
        canCreate: true,
        canDelete: true,
        acl: { type: "collection" },
      },
    },
    {
      name: "crm_activities",
      list: crmRoutes.activities,
      create: crmRoutes.activitiesCreate,
      edit: crmRoutes.activitiesEdit,
      meta: {
        label: "Activities",
        singularLabel: "Activity",
        priority: 30,
        icon: <Activity />,
        description: "Calls, meetings and emails logged against customers.",
        canCreate: true,
        acl: { type: "collection" },
      },
    },
    {
      name: "crm_follow_ups",
      list: crmRoutes.followUps,
      create: crmRoutes.followUpsCreate,
      edit: crmRoutes.followUpsEdit,
      meta: {
        label: "Follow-ups",
        singularLabel: "Follow-up",
        priority: 40,
        icon: <CalendarClock />,
        description: "Reminders so nothing slips.",
        canCreate: true,
        acl: { type: "collection" },
      },
    },
  ],
  routes: (
    <>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/customers" element={<CustomersLayout />}>
        <Route
          path="create"
          element={
            <CanAccess resource="crm_customers" action="create" fallback={<AccessDenied />}>
              <CustomerCreate />
            </CanAccess>
          }
        />
        <Route
          path="edit/:id"
          element={
            <CanAccess resource="crm_customers" action="edit" fallback={<AccessDenied />}>
              <CustomerEdit />
            </CanAccess>
          }
        />
        <Route
          path="show/:id"
          element={
            <CanAccess resource="crm_customers" action="show" fallback={<AccessDenied />}>
              <CustomerShow />
            </CanAccess>
          }
        >
          <Route
            path="edit"
            element={
              <CanAccess resource="crm_customers" action="edit" fallback={<AccessDenied />}>
                <CustomerEdit returnTo="show" />
              </CanAccess>
            }
          />
          <Route
            path="contacts/create"
            element={
              <CanAccess resource="crm_contacts" action="create" fallback={<AccessDenied />}>
                <ContactCreate />
              </CanAccess>
            }
          />
          <Route
            path="contacts/edit/:contactId"
            element={
              <CanAccess resource="crm_contacts" action="edit" fallback={<AccessDenied />}>
                <ContactEdit />
              </CanAccess>
            }
          />
          <Route
            path="deals/create"
            element={
              <CanAccess resource="crm_deals" action="create" fallback={<AccessDenied />}>
                <CustomerNestedDealCreate />
              </CanAccess>
            }
          />
          <Route
            path="deals/edit/:dealId"
            element={
              <CanAccess resource="crm_deals" action="edit" fallback={<AccessDenied />}>
                <CustomerNestedDealEdit />
              </CanAccess>
            }
          />
          <Route
            path="activities/create"
            element={
              <CanAccess resource="crm_activities" action="create" fallback={<AccessDenied />}>
                <CustomerNestedActivityCreate />
              </CanAccess>
            }
          />
          <Route
            path="activities/edit/:activityId"
            element={
              <CanAccess resource="crm_activities" action="edit" fallback={<AccessDenied />}>
                <CustomerNestedActivityEdit />
              </CanAccess>
            }
          />
          <Route
            path="follow-ups/create"
            element={
              <CanAccess resource="crm_follow_ups" action="create" fallback={<AccessDenied />}>
                <CustomerNestedFollowUpCreate />
              </CanAccess>
            }
          />
          <Route
            path="follow-ups/edit/:followUpId"
            element={
              <CanAccess resource="crm_follow_ups" action="edit" fallback={<AccessDenied />}>
                <CustomerNestedFollowUpEdit />
              </CanAccess>
            }
          />
        </Route>
      </Route>
      <Route path="/pipeline" element={<PipelinePage />}>
        <Route
          path="create"
          element={
            <CanAccess resource="crm_deals" action="create" fallback={<AccessDenied />}>
              <DealCreate />
            </CanAccess>
          }
        />
        <Route
          path="edit/:id"
          element={
            <CanAccess resource="crm_deals" action="edit" fallback={<AccessDenied />}>
              <DealEdit />
            </CanAccess>
          }
        />
      </Route>
      <Route path="/activities" element={<ActivitiesLayout />}>
        <Route
          path="create"
          element={
            <CanAccess resource="crm_activities" action="create" fallback={<AccessDenied />}>
              <ActivityCreate />
            </CanAccess>
          }
        />
        <Route
          path="edit/:id"
          element={
            <CanAccess resource="crm_activities" action="edit" fallback={<AccessDenied />}>
              <ActivityEdit />
            </CanAccess>
          }
        />
      </Route>
      <Route path="/follow-ups" element={<FollowUpsLayout />}>
        <Route
          path="create"
          element={
            <CanAccess resource="crm_follow_ups" action="create" fallback={<AccessDenied />}>
              <FollowUpCreate />
            </CanAccess>
          }
        />
        <Route
          path="edit/:id"
          element={
            <CanAccess resource="crm_follow_ups" action="edit" fallback={<AccessDenied />}>
              <FollowUpEdit />
            </CanAccess>
          }
        />
      </Route>
    </>
  ),
};

export default crmExtension;
