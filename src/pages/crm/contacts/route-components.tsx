import { AccessDenied } from "@/components/access-control/access-denied";
import { CanAccess } from "@/components/access-control/can-access";
import { ContactCreate, ContactEdit } from "./form";

export function ContactCreateRoute() {
  return (
    <CanAccess resource="crm_contacts" action="create" fallback={<AccessDenied />}>
      <ContactCreate />
    </CanAccess>
  );
}

export function ContactEditRoute() {
  return (
    <CanAccess resource="crm_contacts" action="edit" fallback={<AccessDenied />}>
      <ContactEdit />
    </CanAccess>
  );
}
