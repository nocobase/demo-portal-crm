import { type useTranslate } from "@refinedev/core";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FOLLOW_UP_STATUSES, toDateInputValue } from "../constants";
import { CustomerPicker } from "../pickers";
import type { FollowUpFormValues, FollowUpRecord } from "../types";

type Translate = ReturnType<typeof useTranslate>;

export function FollowUpFormFields({
  form,
  translate,
  presetCustomerId,
  record,
}: {
  form: UseFormReturn<FollowUpFormValues>;
  translate: Translate;
  presetCustomerId?: string;
  record?: FollowUpRecord | null;
}) {
  const customerInitial = useMemo(
    () =>
      record?.customer?.company_name
        ? {
            value: String(record.customer.id),
            label: record.customer.company_name,
          }
        : null,
    [record]
  );

  return (
    <>
      <FormField
        control={form.control}
        name="subject"
        rules={{
          required: translate(
            "crm.followUps.validation.subject",
            { ns: "app" },
            "Subject is required"
          ),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.followUps.fields.subject", { ns: "app" }, "Subject")}
            </FormLabel>
            <FormControl
              render={
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.followUps.form.subject.placeholder",
                    { ns: "app" },
                    "e.g. Send revised quote for walnut desks"
                  )}
                />
              }
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="due_date"
          rules={{
            required: translate(
              "crm.followUps.validation.dueDate",
              { ns: "app" },
              "Pick a due date"
            ),
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.followUps.fields.dueDate", { ns: "app" }, "Due date")}
              </FormLabel>
              <FormControl
                render={
                  <Input
                    {...field}
                    value={toDateInputValue(field.value)}
                    type="date"
                    onChange={(event) =>
                      field.onChange(event.target.value || null)
                    }
                  />
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.followUps.fields.status", { ns: "app" }, "Status")}
              </FormLabel>
              <FormControl
                render={
                  <Select
                    value={field.value ?? "pending"}
                    onValueChange={(value) => field.onChange(value ?? "pending")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLLOW_UP_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="customer_id"
        rules={{
          required: translate(
            "crm.followUps.validation.customer",
            { ns: "app" },
            "Pick the customer for this follow-up"
          ),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.followUps.fields.customer", { ns: "app" }, "Customer")}
            </FormLabel>
            <FormControl
              render={
                <CustomerPicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={Boolean(presetCustomerId)}
                  initialOption={customerInitial}
                />
              }
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.followUps.fields.notes", { ns: "app" }, "Notes")}
            </FormLabel>
            <FormControl
              render={
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.followUps.form.notes.placeholder",
                    { ns: "app" },
                    "Anything to remember when you follow up"
                  )}
                />
              }
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
