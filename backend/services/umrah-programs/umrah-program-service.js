// services/umrah-programs/umrah-program-service.js

/*
=====================================================
Umrah Program Service
=====================================================

هذا الملف يحتوي على منطق برامج العمرة.

مسؤول عن:
-----------------------------------------------------
- إنشاء برنامج
- عرض البرامج
- عرض برنامج واحد
- تحديث البرنامج
- تغيير حالة البرنامج
- حجز مقاعد من البرنامج
- إرجاع مقاعد للبرنامج
- حذف البرنامج حذفًا ناعمًا
- استرجاع البرنامج المحذوف

ملاحظة:
-----------------------------------------------------
الـ controller لا يحتوي Business Logic.
كل المنطق الحقيقي موجود هنا.
=====================================================
*/

import UmrahProgram from "../../models/umrah-programs/umrah-program-model.js";

import { buildUmrahProgramFilter } from "../../utils/buildUmrahProgramFilter.js";
import { buildUmrahProgramSort } from "../../utils/buildUmrahProgramSort.js";
import AppError from "../../utils/AppError.js";

import {
  softDeleteDocument,
  restoreDeletedDocument,
} from "../../utils/softDelete.js";

import { createAuditLog } from "../audit/audit-log-service.js";

import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

import {
  UMRAH_PROGRAM_STATUS,
} from "../../constants/umrah-programs/umrah-program-status.js";

/*
=====================================================
createUmrahProgram
=====================================================

إنشاء برنامج عمرة جديد.

الخطوات:
-----------------------------------------------------
1. استقبال البيانات من controller
2. إضافة createdBy
3. إنشاء البرنامج
4. تسجيل العملية في Audit Log
5. إرجاع البرنامج
=====================================================
*/

export const createUmrahProgram = async ({ data, userId, req }) => {
  const program = await UmrahProgram.create({
    ...data,
    createdBy: userId || null,
  });

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before: null,
    after: program.toObject(),
    metadata: {
      module: "umrah-programs",
    },
  });

  return program;
};

/*
=====================================================
getAllUmrahPrograms
=====================================================

جلب كل البرامج غير المحذوفة.

يدعم:
-----------------------------------------------------
- البحث
- الفلترة
- الترتيب
- pagination
=====================================================
*/

export const getAllUmrahPrograms = async ({ query }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = buildUmrahProgramFilter(query);
  const sortOption = buildUmrahProgramSort(query);

  const [items, total] = await Promise.all([
    UmrahProgram.find(filter)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),

    UmrahProgram.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

/*
=====================================================
getPublicUmrahPrograms
=====================================================

جلب البرامج الظاهرة للعملاء فقط.

الشروط:
-----------------------------------------------------
- غير محذوف
- isActive = true
- status = active
=====================================================
*/

export const getPublicUmrahPrograms = async ({ query }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    ...buildUmrahProgramFilter(query),
    isActive: true,
    status: UMRAH_PROGRAM_STATUS.ACTIVE,
  };

  const sortOption = buildUmrahProgramSort(query);

  const [items, total] = await Promise.all([
    UmrahProgram.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit),

    UmrahProgram.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

export const getPublicUmrahProgramById = async (programId) => {
  const program = await UmrahProgram.findOne({
    _id: programId,
    isDeleted: false,
    isActive: true,
    status: UMRAH_PROGRAM_STATUS.ACTIVE,
  });

  if (!program) {
    throw new Error("Umrah program not found");
  }

  return program;
};

/*
=====================================================
getUmrahProgramById
=====================================================

جلب برنامج واحد بشرط ألا يكون محذوفًا.
=====================================================
*/

export const getUmrahProgramById = async (programId) => {
  const program = await UmrahProgram.findOne({
    _id: programId,
    isDeleted: false,
  })
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");

  if (!program) {
    throw new Error("Umrah program not found");
  }

  return program;
};

/*
=====================================================
updateUmrahProgram
=====================================================

تحديث برنامج عمرة.

الخطوات:
-----------------------------------------------------
1. جلب البرنامج
2. حفظ نسخة قبل التعديل
3. تحديث البيانات
4. إضافة updatedBy
5. حفظ البرنامج
6. تسجيل Audit Log
=====================================================
*/

export const updateUmrahProgram = async ({
  programId,
  data,
  userId,
  req,
}) => {
  const program = await UmrahProgram.findOne({
    _id: programId,
    isDeleted: false,
  });

  if (!program) {
    throw new Error("Umrah program not found");
  }

  const before = program.toObject();

  Object.assign(program, data);

  program.updatedBy = userId || null;

  await program.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before,
    after: program.toObject(),
    metadata: {
      module: "umrah-programs",
    },
  });

  return program;
};

/*
=====================================================
changeUmrahProgramStatus
=====================================================

تغيير حالة البرنامج فقط.

مثال:
-----------------------------------------------------
draft -> active
active -> inactive
active -> sold_out
=====================================================
*/

export const changeUmrahProgramStatus = async ({
  programId,
  status,
  userId,
  req,
}) => {
  const program = await UmrahProgram.findOne({
    _id: programId,
    isDeleted: false,
  });

  if (!program) {
    throw new Error("Umrah program not found");
  }

  const before = program.toObject();

  program.status = status;
  program.updatedBy = userId || null;

  await program.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before,
    after: program.toObject(),
    metadata: {
      newStatus: status,
    },
  });

  return program;
};

const PROGRAM_CAPACITY_UPDATE_RETRIES = 5;

const normalizeRequestedSeats = (value) => {
  const seats = Number(value);

  if (!Number.isFinite(seats) || seats <= 0 || !Number.isInteger(seats)) {
    throw new AppError(
      "عدد المقاعد يجب أن يكون رقمًا صحيحًا أكبر من صفر",
      400,
      "seats",
    );
  }

  return seats;
};

export const reserveProgramSeats = async ({
  programId,
  seats = 1,
  req,
}) => {
  const requestedSeats = normalizeRequestedSeats(seats);

  for (let attempt = 0; attempt < PROGRAM_CAPACITY_UPDATE_RETRIES; attempt += 1) {
    const before = await UmrahProgram.findOne({
      _id: programId,
      isDeleted: false,
      isActive: true,
    }).lean();

    if (!before) {
      throw new AppError("برنامج العمرة غير موجود", 404, "program");
    }

    if (before.status !== UMRAH_PROGRAM_STATUS.ACTIVE) {
      throw new AppError("برنامج العمرة غير متاح للحجز", 400, "program");
    }

    const totalSeats = Number(before.capacity?.totalSeats || 0);
    const availableSeats = Number(before.capacity?.availableSeats || 0);
    const bookedSeats = Number(before.capacity?.bookedSeats || 0);

    if (availableSeats < requestedSeats) {
      throw new AppError(
        `المقاعد المتاحة في هذا البرنامج ${availableSeats} فقط، ولا يمكن حجز ${requestedSeats} معتمر`,
        400,
        "seats",
      );
    }

    const nextAvailableSeats = availableSeats - requestedSeats;
    const update = {
      $set: {
        "capacity.bookedSeats": bookedSeats + requestedSeats,
        "capacity.availableSeats": nextAvailableSeats,
        status: nextAvailableSeats === 0
          ? UMRAH_PROGRAM_STATUS.SOLD_OUT
          : UMRAH_PROGRAM_STATUS.ACTIVE,
      },
    };

    if (req?.user?._id) update.$set.updatedBy = req.user._id;

    const program = await UmrahProgram.findOneAndUpdate(
      {
        _id: programId,
        isDeleted: false,
        isActive: true,
        status: UMRAH_PROGRAM_STATUS.ACTIVE,
        "capacity.totalSeats": totalSeats,
        "capacity.availableSeats": { $eq: availableSeats, $gte: requestedSeats },
        "capacity.bookedSeats": bookedSeats,
      },
      update,
      { new: true, runValidators: true },
    );

    if (!program) continue;

    await createAuditLog({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
      entityId: program._id,
      before,
      after: program.toObject(),
      metadata: { operation: "reserve_seats", seats: requestedSeats },
    });

    return program;
  }

  throw new AppError(
    "تعذر حجز المقاعد بسبب تغير السعة أثناء العملية، يرجى المحاولة مرة أخرى",
    409,
    "seats",
  );
};

/*
=====================================================
releaseProgramSeats
=====================================================

إرجاع مقاعد للبرنامج.

تستخدم لاحقًا عند:
-----------------------------------------------------
- إلغاء الحجز
- فشل الدفع
- حذف الحجز

الخطوات:
-----------------------------------------------------
1. جلب البرنامج
2. تقليل bookedSeats
3. زيادة availableSeats
4. إذا كان البرنامج sold_out وصارت فيه مقاعد، يرجع active
=====================================================
*/

export const releaseProgramSeats = async ({
  programId,
  seats = 1,
  req,
}) => {
  const requestedSeats = normalizeRequestedSeats(seats);

  for (let attempt = 0; attempt < PROGRAM_CAPACITY_UPDATE_RETRIES; attempt += 1) {
    const before = await UmrahProgram.findOne({
      _id: programId,
      isDeleted: false,
    }).lean();

    if (!before) {
      throw new AppError("برنامج العمرة غير موجود", 404, "program");
    }

    const totalSeats = Number(before.capacity?.totalSeats || 0);
    const bookedSeats = Number(before.capacity?.bookedSeats || 0);
    const availableSeats = Number(before.capacity?.availableSeats || 0);
    const actualReleasedSeats = Math.min(requestedSeats, bookedSeats);

    if (actualReleasedSeats <= 0) return UmrahProgram.findById(programId);

    const nextAvailableSeats = Math.min(
      availableSeats + actualReleasedSeats,
      totalSeats,
    );
    const nextStatus =
      before.status === UMRAH_PROGRAM_STATUS.SOLD_OUT && nextAvailableSeats > 0
        ? UMRAH_PROGRAM_STATUS.ACTIVE
        : before.status;
    const update = {
      $set: {
        "capacity.bookedSeats": bookedSeats - actualReleasedSeats,
        "capacity.availableSeats": nextAvailableSeats,
        status: nextStatus,
      },
    };

    if (req?.user?._id) update.$set.updatedBy = req.user._id;

    const program = await UmrahProgram.findOneAndUpdate(
      {
        _id: programId,
        isDeleted: false,
        "capacity.totalSeats": totalSeats,
        "capacity.bookedSeats": bookedSeats,
        "capacity.availableSeats": availableSeats,
      },
      update,
      { new: true, runValidators: true },
    );

    if (!program) continue;

    await createAuditLog({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
      entityId: program._id,
      before,
      after: program.toObject(),
      metadata: {
        operation: "release_seats",
        requestedSeats,
        releasedSeats: actualReleasedSeats,
      },
    });

    return program;
  }

  throw new AppError(
    "تعذر إرجاع المقاعد بسبب تغير السعة أثناء العملية، يرجى المحاولة مرة أخرى",
    409,
    "seats",
  );
};

/*
=====================================================
softDeleteUmrahProgram
=====================================================

حذف برنامج العمرة حذفًا ناعمًا.

لا يتم حذف البرنامج نهائيًا من قاعدة البيانات.
=====================================================
*/

export const softDeleteUmrahProgram = async ({
  programId,
  userId,
  req,
}) => {
  const program = await UmrahProgram.findById(programId);

  if (!program) {
    throw new Error("Umrah program not found");
  }

  const before = program.toObject();

  const deletedProgram = await softDeleteDocument({
    document: program,
    userId,
  });

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before,
    after: deletedProgram.toObject(),
    metadata: {
      module: "umrah-programs",
    },
  });

  return deletedProgram;
};

/*
=====================================================
restoreUmrahProgram
=====================================================

استرجاع برنامج محذوف حذفًا ناعمًا.
=====================================================
*/

export const restoreUmrahProgram = async ({ programId, req }) => {
  const program = await UmrahProgram.findById(programId);

  if (!program) {
    throw new Error("Umrah program not found");
  }

  const before = program.toObject();

  const restoredProgram = await restoreDeletedDocument({
    document: program,
  });

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.RESTORE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before,
    after: restoredProgram.toObject(),
    metadata: {
      module: "umrah-programs",
    },
  });

  return restoredProgram;
};
