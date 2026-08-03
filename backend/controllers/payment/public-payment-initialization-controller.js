import { initializePublicPaymentService } from "../../services/payment/initialize-public-payment-service.js";

import { validateInitializePublicPayment } from "../../services/validators/payment/initialize-public-payment-validation.js";

export const initializePublicPayment = async (req, res, next) => {
  try {
    const validatedData = validateInitializePublicPayment(req.body);

    const result = await initializePublicPaymentService({
      ...validatedData,

      userId: req.user?._id || req.user?.id || null,

      req,
    });

    return res.status(201).json({
      success: true,

      message: "تم تهيئة عملية الدفع بنجاح",

      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
