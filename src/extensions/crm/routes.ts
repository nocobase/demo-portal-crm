const enc = (id: string | number) => encodeURIComponent(String(id));

export const crmRoutes = {
  dashboard: "/dashboard",
  customers: "/customers",
  customersCreate: "/customers/create",
  customersEdit: "/customers/edit/:id",
  customersShow: "/customers/show/:id",
  pipeline: "/pipeline",
  dealsCreate: "/pipeline/create",
  dealsEdit: "/pipeline/edit/:id",
  activities: "/activities",
  activitiesCreate: "/activities/create",
  activitiesEdit: "/activities/edit/:id",
  followUps: "/follow-ups",
  followUpsCreate: "/follow-ups/create",
  followUpsEdit: "/follow-ups/edit/:id",
} as const;

export const getCustomerShowPath = (id: string | number) =>
  `/customers/show/${enc(id)}`;
export const getCustomerEditPath = (id: string | number) =>
  `/customers/edit/${enc(id)}`;
export const getDealEditPath = (id: string | number) =>
  `/pipeline/edit/${enc(id)}`;
export const getActivityEditPath = (id: string | number) =>
  `/activities/edit/${enc(id)}`;
export const getFollowUpEditPath = (id: string | number) =>
  `/follow-ups/edit/${enc(id)}`;

export const getCustomerNestedPath = (
  id: string | number,
  nested: string
) => `/customers/show/${enc(id)}/${nested}`;
