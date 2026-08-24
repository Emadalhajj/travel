export const INVENTORY_HOLD_STATUSES = Object.freeze({
  CREATING: "creating",
  HELD: "held",
  RELEASING: "releasing",
  COMMITTED: "committed",
  RELEASED: "released",
  EXPIRED: "expired",
  RELEASE_FAILED: "release_failed",
});

export const INVENTORY_HOLD_STATUS_VALUES = Object.freeze(
  Object.values(INVENTORY_HOLD_STATUSES),
);

export const TERMINAL_INVENTORY_HOLD_STATUSES = Object.freeze([
  INVENTORY_HOLD_STATUSES.COMMITTED,
  INVENTORY_HOLD_STATUSES.RELEASED,
  INVENTORY_HOLD_STATUSES.EXPIRED,
]);
