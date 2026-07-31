import { type HttpError, useTranslate } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RouteDrawer,
  RouteDrawerFooter,
  useRefineUnsavedChangesGuard,
  useRouteSurfaceClose,
} from "@/extensions/nocobase-route-surfaces";
import { getCustomerShowPath } from "../routes";
import type { ContactFormValues, ContactRecord } from "../types";

type Translate = ReturnType<typeof useTranslate>;

function ContactFormFields({
  form,
  translate,
}: {
  form: UseFormReturn<ContactFormValues>;
  translate: Translate;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{
          required: translate(
            "crm.contacts.validation.name",
            { ns: "app" },
            "Name is required"
          ),
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.contacts.fields.name", { ns: "app" }, "Name")}
            </FormLabel>
            <FormControl
              render={
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.contacts.form.name.placeholder",
                    { ns: "app" },
                    "e.g. Maya Chen"
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
        name="job_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {translate("crm.contacts.fields.jobTitle", { ns: "app" }, "Job title")}
            </FormLabel>
            <FormControl
              render={
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.contacts.form.jobTitle.placeholder",
                    { ns: "app" },
                    "e.g. Office Manager"
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
          name="email"
          rules={{
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: translate(
                "crm.contacts.validation.emailFormat",
                { ns: "app" },
                "Enter a valid email address"
              ),
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.contacts.fields.email", { ns: "app" }, "Email")}
              </FormLabel>
              <FormControl
                render={
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    placeholder="name@example.com"
                  />
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {translate("crm.contacts.fields.phone", { ns: "app" }, "Phone")}
              </FormLabel>
              <FormControl
                render={
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="tel"
                    placeholder="+1-555-0100"
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
              {translate("crm.contacts.fields.notes", { ns: "app" }, "Notes")}
            </FormLabel>
            <FormControl
              render={
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={translate(
                    "crm.contacts.form.notes.placeholder",
                    { ns: "app" },
                    "Role in the buying decision, preferences..."
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

const defaultValues: ContactFormValues = {
  name: "",
  job_title: "",
  email: "",
  phone: "",
  customer_id: null,
  notes: "",
};

const toServerValues = (values: ContactFormValues) => {
  const { customer_id, ...rest } = values;
  return { ...rest, customer: customer_id } as unknown as ContactFormValues;
};

export const ContactCreate = () => {
  const translate = useTranslate();
  const { id: customerId } = useParams<{ id: string }>();
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  const closeTo = customerId ? getCustomerShowPath(customerId) : "/customers";
  return (
    <>
      <RouteDrawer
        title={translate("crm.contacts.drawer.create.title", { ns: "app" }, "Add contact")}
        description={translate(
          "crm.contacts.drawer.create.description",
          { ns: "app" },
          "Someone you deal with at this company."
        )}
        closeTo={closeTo}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <ContactCreateForm customerId={customerId} translate={translate} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function ContactCreateForm({
  customerId,
  translate,
}: {
  customerId?: string;
  translate: Translate;
}) {
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<ContactRecord, HttpError, ContactFormValues>({
    refineCoreProps: {
      resource: "crm_contacts",
      action: "create",
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
    defaultValues: {
      ...defaultValues,
      customer_id: customerId ? String(customerId) : null,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onFinish(toServerValues(values)))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <ContactFormFields form={form} translate={translate} />
        </div>
        <RouteDrawerFooter className="flex-row justify-end">
          <Button type="button" variant="outline" onClick={() => close()}>
            {translate("crm.common.cancel", { ns: "app" }, "Cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? translate("crm.contacts.form.creating", { ns: "app" }, "Adding...")
              : translate("crm.contacts.form.create", { ns: "app" }, "Add contact")}
          </Button>
        </RouteDrawerFooter>
      </form>
    </Form>
  );
}

export const ContactEdit = () => {
  const translate = useTranslate();
  const { id: customerId, contactId } = useParams<{
    id: string;
    contactId: string;
  }>();
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  const closeTo = customerId ? getCustomerShowPath(customerId) : "/customers";
  return (
    <>
      <RouteDrawer
        title={translate("crm.contacts.drawer.edit.title", { ns: "app" }, "Edit contact")}
        closeTo={closeTo}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <ContactEditForm recordId={contactId} translate={translate} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function ContactEditForm({
  recordId,
  translate,
}: {
  recordId?: string;
  translate: Translate;
}) {
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<ContactRecord, HttpError, ContactFormValues>({
    refineCoreProps: {
      resource: "crm_contacts",
      action: "edit",
      id: recordId,
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onFinish(toServerValues(values)))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <ContactFormFields form={form} translate={translate} />
        </div>
        <RouteDrawerFooter className="flex-row justify-end">
          <Button type="button" variant="outline" onClick={() => close()}>
            {translate("crm.common.cancel", { ns: "app" }, "Cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? translate("crm.common.saving", { ns: "app" }, "Saving...")
              : translate("crm.common.save", { ns: "app" }, "Save changes")}
          </Button>
        </RouteDrawerFooter>
      </form>
    </Form>
  );
}
