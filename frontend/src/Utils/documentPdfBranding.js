import { apiGetDocumentBranding } from "../services/api/admin/documentBranding";

const fallbackBranding = {
  companyNameAr: "",
  companyNameEn: "",
  addressAr: "",
  addressEn: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  logoDataUrl: "",
  qrValue: "",
  showLogo: true,
  showQr: true,
};
let cachedBranding = null;

export const PDF_LAYOUT = Object.freeze({
  headerSeparatorY: 96,
  contentTop: 104,
  footerHeight: 80,
  contentBottom: 88,
});

const icons = {
  phone:
    '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M6.6 10.8c1.7 3.4 3.2 4.9 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.7 3.8.7.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 3.7c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.3.2 2.6.7 3.8.1.4 0 .8-.3 1.1l-2.1 2.2z" fill="#475569"/></svg>',
  whatsapp:
    '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.7 12.7c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.1.2-3.6-.8-3-1.2-4.9-4.3-5-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5l.9 2.1c.1.2.1.5 0 .7l-.5.7c-.2.2-.4.4-.2.7.2.3.8 1.3 1.8 2.1 1.2 1.1 2.3 1.5 2.6 1.7.3.1.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2 .9c.3.2.6.3.7.4.1.2.1.8-.1 1.7z" fill="#16a34a"/></svg>',
  email:
    '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M3 5h18v14H3V5zm9 7 7-5H5l7 5zm0 2L5 9v8h14V9l-7 5z" fill="#475569"/></svg>',
  website:
    '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3.1a15 15 0 0 0-1.4-3.2A8.1 8.1 0 0 1 18.9 8zM12 4c.9 1.1 1.6 2.4 1.9 4h-3.8c.3-1.6 1-2.9 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.9a17 17 0 0 0 0 4H4.3zm.8 2h3.1c.3 1.2.8 2.3 1.4 3.2A8.1 8.1 0 0 1 5.1 16zm3.1-8H5.1a8.1 8.1 0 0 1 4.5-3.2A15 15 0 0 0 8.2 8zm3.8 12c-.9-1.1-1.6-2.4-1.9-4h3.8c-.3 1.6-1 2.9-1.9 4zm2.3-6H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4zm.1 5.2c.6-.9 1.1-2 1.4-3.2h3.1a8.1 8.1 0 0 1-4.5 3.2zM15.8 14a17 17 0 0 0 0-4h3.9a8 8 0 0 1 0 4h-3.9z" fill="#475569"/></svg>',
};

export const clearDocumentBrandingCache = () => {
  cachedBranding = null;
};

export const loadDocumentBranding = async () => {
  if (cachedBranding) return cachedBranding;
  try {
    const response = await apiGetDocumentBranding();
    cachedBranding = { ...fallbackBranding, ...(response.data?.data || {}) };
  } catch (_error) {
    cachedBranding = fallbackBranding;
  }
  return cachedBranding;
};

export const resolvePdfQrValue = (branding = {}) => {
  const value = String(branding.qrValue || branding.website || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;
  return value;
};

export const buildPdfBrandingHeader = ({ branding, lang = "ar", title }) => {
  const companyName =
    lang === "ar"
      ? branding.companyNameAr || branding.companyNameEn
      : branding.companyNameEn || branding.companyNameAr;
  const logo =
    branding.showLogo && branding.logoDataUrl
      ? { image: branding.logoDataUrl, fit: [100, 68], alignment: "left" }
      : { text: "", width: 100 };
  return {
    rtl: false,
    margin: [28, 14, 28, 0],
    stack: [
      {
        columns: [
          { width: 110, ...logo },
          {
            width: "*",
            alignment: "right",
            stack: [
              {
                text: companyName || " ",
                bold: true,
                fontSize: 16,
                color: "#1e293b",
                margin: [0, 7, 0, 7],
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 270,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: "#64748b",
                  },
                ],
              },
              {
                text: title,
                bold: true,
                fontSize: 16,
                color: "#334155",
                margin: [0, 7, 0, 0],
              },
            ],
          },
        ],
        columnGap: 18,
      },
    ],
  };
};

const contactCell = (icon, value) => ({
  noWrap: true,
  margin: [0, 0, 0, 0],
  columns: [
    { width: 11, svg: icons[icon], fit: [9, 9] },
    {
      width: "*",
      text: value,
      fontSize: icon === "website" ? 7 : 7.5,
      color: "#334155",
      alignment: "left",
      noWrap: true,
    },
  ],
  columnGap: 1,
});

export const buildPdfBrandingFooter =
  ({ branding, lang = "ar" }) =>
  (currentPage, pageCount) => {
    const address =
      lang === "ar"
        ? branding.addressAr || branding.addressEn
        : branding.addressEn || branding.addressAr;
    const contacts = [
      branding.phone && { type: "phone", cell: contactCell("phone", branding.phone) },
      branding.whatsapp && { type: "whatsapp", cell: contactCell("whatsapp", branding.whatsapp) },
      branding.email && { type: "email", cell: contactCell("email", branding.email) },
      branding.website && { type: "website", cell: contactCell("website", branding.website) },
    ].filter(Boolean);
    const qrValue = branding.showQr ? resolvePdfQrValue(branding) : "";
    const information = {
      width: "*",
      stack: [
        ...(address
          ? [
              {
                text: address,
                bold: true,
                fontSize: 10,
                color: "#334155",
                alignment: lang === "ar" ? "right" : "left",
                margin: [0, 0, 0, 6],
              },
            ]
          : []),
        ...(contacts.length
          ? [
              {
                table: {
                  widths: contacts.map(({ type }) => ({
                    phone: "17%",
                    whatsapp: "17%",
                    email: "28%",
                    website: "38%",
                  }[type])),
                  body: [contacts.map(({ cell }) => cell)],
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  paddingLeft: () => 1,
                  paddingRight: () => 1,
                  paddingTop: () => 0,
                  paddingBottom: () => 0,
                },
              },
            ]
          : []),
        {
          text: `${currentPage} / ${pageCount}`,
          fontSize: 8,
          alignment: "center",
          color: "#64748b",
          margin: [0, 7, 0, 0],
        },
      ],
    };
    const columns = [information];
    if (qrValue) {
      columns.push({
        width: 70,
        stack: [
          { qr: qrValue, fit: 52, alignment: "center" },
          {
            text: qrValue,
            link: /^https?:\/\//i.test(qrValue) ? qrValue : undefined,
            fontSize: 5.5,
            color: "#64748b",
            alignment: "center",
            margin: [0, 2, 0, 0],
          },
        ],
      });
    }
    return { rtl: false, columns, columnGap: 10, margin: [28, 8, 28, 3] };
  };

export const buildPdfPageDecoration = (_currentPage, pageSize) => ({
  canvas: [
    {
      type: "rect",
      x: 12,
      y: 12,
      w: pageSize.width - 24,
      h: pageSize.height - 24,
      r: 5,
      lineWidth: 1,
      lineColor: "#94a3b8",
    },
    {
      type: "rect",
      x: 13,
      y: 13,
      w: pageSize.width - 26,
      h: PDF_LAYOUT.headerSeparatorY - 13,
      r: 4,
      color: "#f1f5f9",
    },
    {
      type: "line",
      x1: 20,
      y1: PDF_LAYOUT.headerSeparatorY,
      x2: pageSize.width - 20,
      y2: PDF_LAYOUT.headerSeparatorY,
      lineWidth: 0.6,
      lineColor: "#64748b",
    },
    {
      type: "line",
      x1: 20,
      y1: pageSize.height - PDF_LAYOUT.footerHeight,
      x2: pageSize.width - 20,
      y2: pageSize.height - PDF_LAYOUT.footerHeight,
      lineWidth: 0.6,
      lineColor: "#64748b",
    },
  ],
});
