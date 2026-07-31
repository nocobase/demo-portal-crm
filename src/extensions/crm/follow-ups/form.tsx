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
import type { FollowUpFormValues, FollowUpRecord } from "../types";
import { FollowUpFormFields } from "./fields";

type FollowUpSurfaceProps = {
  presetCustomerId?: string;
};

const toServerValues = (values: FollowUpFormValues) => {
  const { customer_id, ...rest } = values;
  return { ...rest, customer: customer_id } as unknown as FollowUpFormValues;
};

const closeToFor = (presetCustomerId?: string) =>
  presetCustomerId
    ? getCustomerShowPath(presetCustomerId)
    : crmRoutes.followUps;

export const FollowUpCreate = ({ presetCustomerId }: FollowUpSurfaceProps) => {
  const translate = useTranslate();
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  return (
    <>
      <RouteDrawer
        title={translate("crm.followUps.drawer.create.title", { ns: "app" }, "New follow-up")}
        description={translate(
          "crm.followUps.drawer.create.description",
          { ns: "app" },
          "Set a reminder so nothing slips."
        )}
        closeTo={closeToFor(presetCustomerId)}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <FollowUpCreateForm presetCustomerId={presetCustomerId} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function FollowUpCreateForm({ presetCustomerId }: FollowUpSurfaceProps) {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<FollowUpRecord, HttpError, FollowUpFormValues>({
    refineCoreProps: {
      resource: "crm_follow_ups",
      action: "create",
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
    defaultValues: {
      subject: "",
      due_date: null,
      status: "pending",
      customer_id: presetCustomerId ? String(presetCustomerId) : null,
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
          <FollowUpFormFields
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
              ? translate("crm.followUps.form.creating", { ns: "app" }, "Adding...")
              : translate("crm.followUps.form.create", { ns: "app" }, "Add follow-up")}
          </Button>
        </RouteDrawerFooter>
      </form>
    </Form>
  );
}

export const FollowUpEdit = ({
  presetCustomerId,
  idParam = "id",
}: FollowUpSurfaceProps & { idParam?: string }) => {
  const translate = useTranslate();
  const params = useParams<Record<string, string>>();
  const recordId = params[idParam];
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();
  return (
    <>
      <RouteDrawer
        title={translate("crm.followUps.drawer.edit.title", { ns: "app" }, "Edit follow-up")}
        closeTo={closeToFor(presetCustomerId)}
        closeLabel={translate("crm.common.close", { ns: "app" }, "Close")}
        beforeClose={beforeClose}
      >
        <FollowUpEditForm recordId={recordId} presetCustomerId={presetCustomerId} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function FollowUpEditForm({
  recordId,
  presetCustomerId,
}: FollowUpSurfaceProps & { recordId?: string }) {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish, query },
    ...form
  } = useForm<FollowUpRecord, HttpError, FollowUpFormValues>({
    refineCoreProps: {
      resource: "crm_follow_ups",
      action: "edit",
      id: recordId,
      redirect: false,
      meta: { appends: ["customer"] },
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
          <FollowUpFormFields
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
