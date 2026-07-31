export type CustomerRecord = {
  id: string | number;
  company_name?: string;
  industry?: string | null;
  status?: string | null;
  website?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerFormValues = {
  company_name: string;
  industry: string | null;
  status: string | null;
  website: string;
  phone: string;
  notes: string;
};

export type ContactRecord = {
  id: string | number;
  name?: string;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  customer_id?: string | number | null;
  customer?: CustomerRecord | null;
  notes?: string | null;
  createdAt?: string;
};

export type ContactFormValues = {
  name: string;
  job_title: string;
  email: string;
  phone: string;
  customer_id: string | null;
  notes: string;
};

export type DealRecord = {
  id: string | number;
  title?: string;
  stage?: string | null;
  amount?: number | null;
  expected_close_date?: string | null;
  closed_date?: string | null;
  customer_id?: string | number | null;
  contact_id?: string | number | null;
  customer?: CustomerRecord | null;
  contact?: ContactRecord | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DealFormValues = {
  title: string;
  stage: string;
  amount: number | null;
  expected_close_date: string | null;
  closed_date: string | null;
  customer_id: string | null;
  contact_id: string | null;
  notes: string;
};

export type ActivityRecord = {
  id: string | number;
  subject?: string;
  type?: string | null;
  date?: string | null;
  customer_id?: string | number | null;
  contact_id?: string | number | null;
  customer?: CustomerRecord | null;
  contact?: ContactRecord | null;
  notes?: string | null;
  createdAt?: string;
};

export type ActivityFormValues = {
  subject: string;
  type: string;
  date: string | null;
  customer_id: string | null;
  contact_id: string | null;
  notes: string;
};

export type FollowUpRecord = {
  id: string | number;
  subject?: string;
  due_date?: string | null;
  status?: string | null;
  customer_id?: string | number | null;
  customer?: CustomerRecord | null;
  notes?: string | null;
  createdAt?: string;
};

export type FollowUpFormValues = {
  subject: string;
  due_date: string | null;
  status: string;
  customer_id: string | null;
  notes: string;
};
