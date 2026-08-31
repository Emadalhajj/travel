import {
  getPublicPaymentTransactionStatusService,
} from "../../services/payment/paymentTransaction-service.js";

export const getPublicPaymentStatus = async (
  req,
  res,
  next,
) => {
  try {
    const status =
      await getPublicPaymentTransactionStatusService({
        transactionId:
          req.params.transactionId,
        userId: req.user?._id,
      });

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    return next(error);
  }
};
