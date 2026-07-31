import { type HttpError, useTranslate } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  RouteDrawer,
  RouteDrawerFooter,
  useRefineUnsavedChangesGuard,
  useRouteSurfaceClose,
} from "@/extensions/nocobase-route-surfaces";
import { crmRoutes } from "../routes";
import type { CustomerFormValues, CustomerRecord } from "../types";
import { CustomerFormFields } from "./fields";

export const CustomerCreate = () => {
  const translate = useTranslate();
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  return (
    <>
      <RouteDrawer
        title={translate("crm.customers.drawer.create.title", { ns: "app" }, "Add customer")}
        description={translate(
          "crm.customers.drawer.create.description",
          { ns: "app" },
          "Add a client company you sell to."
        )}
        closeTo={crmRoutes.customers}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <CustomerCreateForm />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function CustomerCreateForm() {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<CustomerRecord, HttpError, CustomerFormValues>({
    refineCoreProps: {
      resource: "crm_customers",
      action: "create",
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
    defaultValues: {
      company_name: "",
      industry: null,
      status: "active",
      website: "",
      phone: "",
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onFinish(values))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <CustomerFormFields form={form} translate={translate} />
        </div>
        <RouteDrawerFooter className="flex-row justify-end">
          <Button type="button" variant="outline" onClick={() => close()}>
            {translate("crm.common.cancel", { ns: "app" }, "Cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? translate("crm.customers.form.creating", { ns: "app" }, "Adding...")
              : translate("crm.customers.form.create", { ns: "app" }, "Add customer")}
          </Button>
        </RouteDrawerFooter>
      </form>
    </Form>
  );
}

export const CustomerEdit = ({
  returnTo = "list",
}: {
  returnTo?: "list" | "show";
}) => {
  const translate = useTranslate();
  const { id } = useParams<{ id: string }>();
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  const closeTo =
    returnTo === "show" && id
      ? crmRoutes.customersShow.replace(":id", encodeURIComponent(id))
      : crmRoutes.customers;
  return (
    <>
      <RouteDrawer
        title={translate("crm.customers.drawer.edit.title", { ns: "app" }, "Edit customer")}
        description={translate(
          "crm.customers.drawer.edit.description",
          { ns: "app" },
          "Update this account's profile."
        )}
        closeTo={closeTo}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <CustomerEditForm id={id} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function CustomerEditForm({ id }: { id?: string }) {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<CustomerRecord, HttpError, CustomerFormValues>({
    refineCoreProps: {
      resource: "crm_customers",
      action: "edit",
      id,
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onFinish(values))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <CustomerFormFields form={form} translate={translate} />
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
