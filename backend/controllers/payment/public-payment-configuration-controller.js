import asyncHandler from "../../middleware/asyncHandler.js";

import { getPublicPaymentConfigurationsService } from "../../services/payment/public-payment-configuration-service.js";

export const getPublicPaymentConfigurations = asyncHandler(async (req, res) => {
  const { sectionCode, currency, amount } = req.query;

  const configurations = await getPublicPaymentConfigurationsService({
    sectionCode,

    currency,

    amount,
  });

  res.status(200).json({
    success: true,

    data: configurations,
  });
});
