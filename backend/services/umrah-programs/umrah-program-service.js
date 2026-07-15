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

/*
=====================================================
reserveProgramSeats
=====================================================

حجز عدد مقاعد من البرنامج.

تستخدم لاحقًا عند إنشاء Booking.

الخطوات:
-----------------------------------------------------
1. جلب البرنامج
2. التأكد أن البرنامج نشط
3. التأكد من توفر مقاعد كافية
4. زيادة bookedSeats
5. تقليل availableSeats
6. إذا انتهت المقاعد يتم تغيير الحالة إلى sold_out
=====================================================
*/

export const reserveProgramSeats = async ({
  programId,
  seats = 1,
  req,
}) => {
  const program = await UmrahProgram.findOne({
    _id: programId,
    isDeleted: false,
    isActive: true,
  });

  if (!program) {
    throw new Error("Umrah program not found");
  }

  if (program.status !== UMRAH_PROGRAM_STATUS.ACTIVE) {
    throw new Error("Umrah program is not active");
  }

  if (program.capacity.availableSeats < seats) {
    throw new Error(
      `المقاعد المتاحة في هذا البرنامج ${program.capacity.availableSeats} فقط، ولا يمكن حجز ${seats} معتمر`,
    );
  }

  const before = program.toObject();

  program.capacity.bookedSeats += seats;
  program.capacity.availableSeats -= seats;

  if (program.capacity.availableSeats <= 0) {
    program.status = UMRAH_PROGRAM_STATUS.SOLD_OUT;
  }

  await program.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before,
    after: program.toObject(),
    metadata: {
      operation: "reserve_seats",
      seats,
    },
  });

  return program;
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
  const program = await UmrahProgram.findOne({
    _id: programId,
    isDeleted: false,
  });

  if (!program) {
    throw new Error("Umrah program not found");
  }

  const before = program.toObject();

  program.capacity.bookedSeats = Math.max(
    program.capacity.bookedSeats - seats,
    0,
  );

  program.capacity.availableSeats = Math.min(
    program.capacity.availableSeats + seats,
    program.capacity.totalSeats,
  );

  if (
    program.status === UMRAH_PROGRAM_STATUS.SOLD_OUT &&
    program.capacity.availableSeats > 0
  ) {
    program.status = UMRAH_PROGRAM_STATUS.ACTIVE;
  }

  await program.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.UMRAH_PROGRAM,
    entityId: program._id,
    before,
    after: program.toObject(),
    metadata: {
      operation: "release_seats",
      seats,
    },
  });

  return program;
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
