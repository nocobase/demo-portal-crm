import { format } from "date-fns";

export const CURRENCY = "USD";

export const DEAL_STAGES = [
  { value: "inquiry", label: "Inquiry" },
  { value: "quote", label: "Quote" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export const OPEN_DEAL_STAGES = ["inquiry", "quote"];

export const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
] as const;

export const FOLLOW_UP_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
] as const;

export const CUSTOMER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export const INDUSTRIES = [
  { value: "design", label: "Design Studio" },
  { value: "architecture", label: "Architecture" },
  { value: "corporate", label: "Corporate" },
  { value: "education", label: "Education" },
  { value: "hospitality", label: "Hospitality" },
  { value: "other", label: "Other" },
] as const;

const BADGE_CLASSES: Record<string, string> = {
  inquiry: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  quote: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  won: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  lost: "bg-red-500/15 text-red-700 dark:text-red-300",
  call: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  meeting: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  email: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  inactive: "bg-muted text-muted-foreground",
};

export const badgeClassFor = (value: string | null | undefined) =>
  BADGE_CLASSES[value ?? ""] ?? "bg-muted text-muted-foreground";

export const labelFor = (
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined
) => options.find((option) => option.value === value)?.label ?? "—";

export const formatCurrency = (value: number | null | undefined, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const formatDate = (value: string | null | undefined, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(value)
      )
    : "—";

export const formatDateTime = (
  value: string | null | undefined,
  locale: string
) =>
  value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export const toDateInputValue = (value: string | null | undefined) =>
  value ? String(value).slice(0, 10) : "";

export const toDateTimeInputValue = (value: string | null | undefined) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : format(parsed, "yyyy-MM-dd'T'HH:mm");
};
