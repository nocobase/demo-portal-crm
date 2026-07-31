import { type useTranslate } from "@refinedev/core";
import { useMemo } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";
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
import { DEAL_STAGES, toDateInputValue } from "../constants";
import { ContactPicker, CustomerPicker } from "../pickers";
import type { DealFormValues, DealRecord } from "../types";

type Translate = ReturnType<typeof useTranslate>;

export function DealFormFields({
  form,
  translate,
  presetCustomerId,
  record,
}: {
  form: UseFormReturn<DealFormValues>;
  translate: Translate;
  presetCustomerId?: string;
  record?: DealRecord | null;
}) {
  const watchedCustomerId = useWatch({
    control: form.control,
    name: "customer_id",
  });

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
  const contactInitial = useMemo(
    () =>
      record?.contact?.name
        ? { value: String(record.contact.id), label: record.contact.name }
        : null,
    [record]
  );

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        rules={{
          required: translate(
            "crm.deals.validation.title",
            { ns: "app" },
            "Deal title is required"
          ),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.deals.fields.title", { ns: "app" }, "Deal")}
            </FormLabel>
            <FormControl
              render={
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.deals.form.title.placeholder",
                    { ns: "app" },
                    "e.g. HQ desks and task chairs"
                  )}
                />
              }
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="customer_id"
        rules={{
          required: translate(
            "crm.deals.validation.customer",
            { ns: "app" },
            "Pick the customer this deal is for"
          ),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.deals.fields.customer", { ns: "app" }, "Customer")}
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
        name="contact_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.deals.fields.contact", { ns: "app" }, "Contact")}
            </FormLabel>
            <FormControl
              render={
                <ContactPicker
                  customerId={watchedCustomerId}
                  value={field.value}
                  onChange={field.onChange}
                  initialOption={contactInitial}
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
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.deals.fields.stage", { ns: "app" }, "Stage")}
              </FormLabel>
              <FormControl
                render={
                  <Select
                    value={field.value ?? "inquiry"}
                    onValueChange={(value) => field.onChange(value ?? "inquiry")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
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

        <FormField
          control={form.control}
          name="amount"
          rules={{
            required: translate(
              "crm.deals.validation.amount",
              { ns: "app" },
              "Enter the deal value"
            ),
            min: {
              value: 0,
              message: translate(
                "crm.deals.validation.amountMin",
                { ns: "app" },
                "Amount cannot be negative"
              ),
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.deals.fields.amount", { ns: "app" }, "Amount")}
              </FormLabel>
              <FormControl
                render={
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="12000"
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value)
                      )
                    }
                  />
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="expected_close_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.deals.fields.expectedClose", { ns: "app" }, "Expected close")}
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
          name="closed_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.deals.fields.closedDate", { ns: "app" }, "Closed date")}
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
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.deals.fields.notes", { ns: "app" }, "Notes")}
            </FormLabel>
            <FormControl
              render={
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.deals.form.notes.placeholder",
                    { ns: "app" },
                    "Requirements, budget, decision makers..."
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
