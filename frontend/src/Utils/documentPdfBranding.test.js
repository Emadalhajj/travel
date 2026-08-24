import { buildPdfBrandingFooter, buildPdfBrandingHeader, buildPdfPageDecoration, PDF_LAYOUT, resolvePdfQrValue } from "./documentPdfBranding";

jest.mock("../services/api/admin/documentBranding", () => ({ apiGetDocumentBranding: jest.fn() }));

test("PDF branding header contains the configured company name and logo", () => {
  const header = buildPdfBrandingHeader({
    branding: { companyNameAr: "شركة السفر", logoDataUrl: "data:image/png;base64,AA", showLogo: true },
    lang: "ar",
    title: "تقرير",
  });
  expect(header.stack[0].columns[0].image).toContain("data:image/png");
  expect(header.stack[0].columns[1].stack[0].text).toBe("شركة السفر");
  expect(header.stack[0].columns[1].stack[1].canvas[0].x2).toBe(270);
  expect(header.stack[0].columns[1].stack[2].text).toBe("تقرير");
});

test("PDF branding footer adds address, contact details, QR and page numbers", () => {
  const footer = buildPdfBrandingFooter({ branding: {
    addressAr: "الرياض، المملكة العربية السعودية",
    addressEn: "Riyadh, Saudi Arabia",
    phone: "+966500000000",
    email: "info@example.com",
    website: "https://example.com",
    showQr: true,
    qrValue: "https://example.com/verify",
  }, lang: "ar" })(2, 5);
  expect(footer.columns[0].stack[0].text).toBe("الرياض، المملكة العربية السعودية");
  expect(footer.columns[0].stack[1].table.body[0][0].columns[1].text).toBe("+966500000000");
  expect(footer.columns[0].stack[1].table.body[0][1].columns[1].text).toBe("info@example.com");
  expect(footer.columns[0].stack[1].table.body[0][2].columns[1].noWrap).toBe(true);
  expect(footer.columns[0].stack[2].text).toBe("2 / 5");
  expect(footer.columns[1].stack[0].qr).toBe("https://example.com/verify");
});

test("QR resolves a usable web address and page decoration draws borders", () => {
  expect(resolvePdfQrValue({ qrValue: "example.com/verify" })).toBe("https://example.com/verify");
  expect(resolvePdfQrValue({ website: "https://example.com" })).toBe("https://example.com");
  const decoration = buildPdfPageDecoration(1, { width: 595, height: 842 });
  expect(decoration.canvas.some((item) => item.type === "rect")).toBe(true);
  expect(decoration.canvas.filter((item) => item.type === "line")).toHaveLength(2);
  expect(decoration.canvas[2].y1).toBe(PDF_LAYOUT.headerSeparatorY);
  expect(decoration.canvas[3].y1).toBe(842 - PDF_LAYOUT.footerHeight);
});
