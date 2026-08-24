import asyncHandler from "../../middleware/asyncHandler.js";
import {
  getBookingsReportService,
  getPaymentsReportService,
  getProgramsReportService,
  getReportsOverviewService,
} from "../../services/reports/report-service.js";

const sendReport = (service) => asyncHandler(async (req, res) => {
  const data = await service(req.query);
  res.status(200).json({ success: true, data });
});

export const getReportsOverview = sendReport(getReportsOverviewService);
export const getBookingsReport = sendReport(getBookingsReportService);
export const getPaymentsReport = sendReport(getPaymentsReportService);
export const getProgramsReport = sendReport(getProgramsReportService);
