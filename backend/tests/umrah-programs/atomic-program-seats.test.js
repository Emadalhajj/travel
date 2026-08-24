import assert from "node:assert/strict";
import test from "node:test";

import UmrahProgram from "../../models/umrah-programs/umrah-program-model.js";
import AuditLog from "../../models/audit/audit-log-model.js";
import {
  releaseProgramSeats,
  reserveProgramSeats,
} from "../../services/umrah-programs/umrah-program-service.js";
import { UMRAH_PROGRAM_STATUS } from "../../constants/umrah-programs/umrah-program-status.js";

const clone = (value) => structuredClone(value);
const asDocument = (value) => ({
  ...clone(value),
  toObject() {
    const { toObject, ...plain } = this;
    return clone(plain);
  },
});

const installProgramStore = (initialState, { synchronizeFirstReads = false } = {}) => {
  let state = clone(initialState);
  let auditEntries = [];
  let readCount = 0;
  let openReadBarrier;
  const readBarrier = new Promise((resolve) => {
    openReadBarrier = resolve;
  });
  const originals = {
    findOne: UmrahProgram.findOne,
    findOneAndUpdate: UmrahProgram.findOneAndUpdate,
    findById: UmrahProgram.findById,
    auditCreate: AuditLog.create,
  };

  UmrahProgram.findOne = () => ({
    lean: async () => {
      const snapshot = clone(state);
      readCount += 1;
      if (synchronizeFirstReads && readCount <= 2) {
        if (readCount === 2) openReadBarrier();
        await readBarrier;
      }
      return snapshot;
    },
  });

  UmrahProgram.findOneAndUpdate = async (filter, update) => {
    const availableFilter = filter["capacity.availableSeats"];
    const matches =
      String(filter._id) === String(state._id) &&
      (filter.status === undefined || filter.status === state.status) &&
      filter["capacity.totalSeats"] === state.capacity.totalSeats &&
      filter["capacity.bookedSeats"] === state.capacity.bookedSeats &&
      (typeof availableFilter === "object"
        ? state.capacity.availableSeats === availableFilter.$eq &&
          state.capacity.availableSeats >= availableFilter.$gte
        : state.capacity.availableSeats === availableFilter);

    if (!matches) return null;

    for (const [path, value] of Object.entries(update.$set || {})) {
      if (path === "capacity.bookedSeats") state.capacity.bookedSeats = value;
      else if (path === "capacity.availableSeats") state.capacity.availableSeats = value;
      else state[path] = value;
    }

    return asDocument(state);
  };

  UmrahProgram.findById = async () => asDocument(state);
  AuditLog.create = async (entry) => {
    auditEntries.push(clone(entry));
    return entry;
  };

  return {
    getState: () => clone(state),
    getAuditEntries: () => clone(auditEntries),
    restore: () => {
      UmrahProgram.findOne = originals.findOne;
      UmrahProgram.findOneAndUpdate = originals.findOneAndUpdate;
      UmrahProgram.findById = originals.findById;
      AuditLog.create = originals.auditCreate;
    },
  };
};

test("concurrent seat reservations cannot oversell a program", async () => {
  const store = installProgramStore({
    _id: "program-1",
    isDeleted: false,
    isActive: true,
    status: UMRAH_PROGRAM_STATUS.ACTIVE,
    capacity: { totalSeats: 5, bookedSeats: 0, availableSeats: 5 },
  }, { synchronizeFirstReads: true });

  try {
    const results = await Promise.allSettled([
      reserveProgramSeats({ programId: "program-1", seats: 3 }),
      reserveProgramSeats({ programId: "program-1", seats: 3 }),
    ]);

    assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
    assert.equal(results.filter(({ status }) => status === "rejected").length, 1);
    assert.deepEqual(store.getState().capacity, {
      totalSeats: 5,
      bookedSeats: 3,
      availableSeats: 2,
    });
    assert.equal(store.getAuditEntries().length, 1);
    assert.equal(store.getAuditEntries()[0].metadata.operation, "reserve_seats");
  } finally {
    store.restore();
  }
});

test("reserve then release switches sold-out program back to active", async () => {
  const store = installProgramStore({
    _id: "program-2",
    isDeleted: false,
    isActive: true,
    status: UMRAH_PROGRAM_STATUS.ACTIVE,
    capacity: { totalSeats: 1, bookedSeats: 0, availableSeats: 1 },
  });

  try {
    await reserveProgramSeats({ programId: "program-2", seats: 1 });
    assert.equal(store.getState().status, UMRAH_PROGRAM_STATUS.SOLD_OUT);
    assert.equal(store.getState().capacity.availableSeats, 0);

    await releaseProgramSeats({ programId: "program-2", seats: 1 });
    assert.equal(store.getState().status, UMRAH_PROGRAM_STATUS.ACTIVE);
    assert.deepEqual(store.getState().capacity, {
      totalSeats: 1,
      bookedSeats: 0,
      availableSeats: 1,
    });
    assert.equal(store.getAuditEntries().length, 2);
  } finally {
    store.restore();
  }
});

test("concurrent double release never exceeds total capacity", async () => {
  const store = installProgramStore({
    _id: "program-3",
    isDeleted: false,
    isActive: true,
    status: UMRAH_PROGRAM_STATUS.ACTIVE,
    capacity: { totalSeats: 5, bookedSeats: 3, availableSeats: 2 },
  }, { synchronizeFirstReads: true });

  try {
    await Promise.allSettled([
      releaseProgramSeats({ programId: "program-3", seats: 3 }),
      releaseProgramSeats({ programId: "program-3", seats: 3 }),
    ]);

    assert.deepEqual(store.getState().capacity, {
      totalSeats: 5,
      bookedSeats: 0,
      availableSeats: 5,
    });
    assert.equal(store.getAuditEntries().length, 1);
    assert.equal(store.getAuditEntries()[0].metadata.releasedSeats, 3);
  } finally {
    store.restore();
  }
});
