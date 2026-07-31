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
import { crmRoutes, getCustomerShowPath } from "../routes";
import type { DealFormValues, DealRecord } from "../types";
import { DealFormFields } from "./fields";

type DealSurfaceProps = {
  presetCustomerId?: string;
};

const toServerValues = (values: DealFormValues) => {
  const { customer_id, contact_id, ...rest } = values;
  return { ...rest, customer: customer_id, contact: contact_id } as unknown as DealFormValues;
};

const closeToFor = (presetCustomerId?: string) =>
  presetCustomerId ? getCustomerShowPath(presetCustomerId) : crmRoutes.pipeline;

export const DealCreate = ({ presetCustomerId }: DealSurfaceProps) => {
  const translate = useTranslate();
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  return (
    <>
      <RouteDrawer
        title={translate("crm.deals.drawer.create.title", { ns: "app" }, "New deal")}
        description={translate(
          "crm.deals.drawer.create.description",
          { ns: "app" },
          "Add a deal to the pipeline."
        )}
        closeTo={closeToFor(presetCustomerId)}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <DealCreateForm presetCustomerId={presetCustomerId} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function DealCreateForm({ presetCustomerId }: DealSurfaceProps) {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<DealRecord, HttpError, DealFormValues>({
    refineCoreProps: {
      resource: "crm_deals",
      action: "create",
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
    defaultValues: {
      title: "",
      stage: "inquiry",
      amount: null,
      expected_close_date: null,
      closed_date: null,
      customer_id: presetCustomerId ? String(presetCustomerId) : null,
      contact_id: null,
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onFinish(toServerValues(values)))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <DealFormFields
            form={form}
            translate={translate}
            presetCustomerId={presetCustomerId}
          />
        </div>
        <RouteDrawerFooter className="flex-row justify-end">
          <Button type="button" variant="outline" onClick={() => close()}>
            {translate("crm.common.cancel", { ns: "app" }, "Cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? translate("crm.deals.form.creating", { ns: "app" }, "Adding...")
              : translate("crm.deals.form.create", { ns: "app" }, "Add deal")}
          </Button>
        </RouteDrawerFooter>
      </form>
    </Form>
  );
}

export const DealEdit = ({
  presetCustomerId,
  idParam = "id",
}: DealSurfaceProps & { idParam?: string }) => {
  const translate = useTranslate();
  const params = useParams<Record<string, string>>();
  const recordId = params[idParam];
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  return (
    <>
      <RouteDrawer
        title={translate("crm.deals.drawer.edit.title", { ns: "app" }, "Edit deal")}
        description={translate(
          "crm.deals.drawer.edit.description",
          { ns: "app" },
          "Update stage, value and timing."
        )}
        closeTo={closeToFor(presetCustomerId)}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <DealEditForm
          recordId={recordId}
          presetCustomerId={presetCustomerId}
        />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function DealEditForm({
  recordId,
  presetCustomerId,
}: DealSurfaceProps & { recordId?: string }) {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish, query },
    ...form
  } = useForm<DealRecord, HttpError, DealFormValues>({
    refineCoreProps: {
      resource: "crm_deals",
      action: "edit",
      id: recordId,
      redirect: false,
      meta: { appends: ["customer", "contact"] },
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
          <DealFormFields
            form={form}
            translate={translate}
            presetCustomerId={presetCustomerId}
            record={query?.data?.data}
          />
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
