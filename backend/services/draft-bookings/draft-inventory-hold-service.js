import { buildInventoryRequirementsFromDraft } from "./draft-inventory-builder.js";
import { createInventoryHoldService } from "../booking/inventory-hold-service.js";

export const createDraftInventoryHoldEnsurer = ({
  buildRequirements = buildInventoryRequirementsFromDraft,
  createHold = createInventoryHoldService,
} = {}) => async ({
    draft,
    idempotencyKey,
    paymentTransaction = null,
    expiresAt = null,
    userId = null,
    req = null,
  }) => {
  const requirements = buildRequirements({ draft });

  if (
    !requirements.programReservation &&
    requirements.inventoryReservations.length === 0
  ) {
    return null;
  }

  return createHold({
    idempotencyKey,
    draftBooking: draft._id,
    paymentTransaction,
    user: userId || draft.user || req?.user?._id || null,
    programReservation: requirements.programReservation,
    inventoryReservations: requirements.inventoryReservations,
    ...(expiresAt ? { expiresAt } : {}),
    req,
  });
};

export const ensureDraftInventoryHoldService =
  createDraftInventoryHoldEnsurer();
