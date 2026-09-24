import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BedDouble,
  Bus,
  CirclePlus,
  FileCheck2,
  Landmark,
  Plane,
  AwardIcon
} from "lucide-react";

import PageHeader from "../../../Components/layout/PageHeader";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
// import UniversalCardsContainer from "../../../Components/shared/cards/UniversalCardsContainer";

export default function PublicServicesPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const services = [
    {
      _id: "flights",
      titleAr: "الرحلات الجوية",
      titleEn: "Flights",
      descriptionAr: "ابحث واحجز الرحلات الجوية المناسبة",
      descriptionEn: "Search and book the right flights",
      path: "/services/flights",
      icon: Plane,
    },
       {
      _id: "trips",
      titleAr: "الرحلات الاخرى",
      titleEn: "Flights",
      descriptionAr: "ابحث واحجز الرحلات المناسبة",
      descriptionEn: "Search and book the right trips",
      path: "/services/trips",
      icon: AwardIcon,
    },
    {
      _id: "hotels",
      titleAr: "الفنادق",
      titleEn: "Hotels / Accommodation",
      descriptionAr: "ابحث عن السكن المناسب",
      descriptionEn: "Find the right accommodation",
      path: "/services/hotels",
      icon: BedDouble,
    },
    {
      _id: "transports",
      titleAr: "النقل",
      titleEn: "Transport",
      descriptionAr: "سيارات وحافلات وخدمات الانتقال",
      descriptionEn: "Cars, buses and transfer services",
      path: "/services/transports",
      icon: Bus,
    },
    {
      _id: "visas",
      titleAr: "التأشيرات",
      titleEn: "Visas",
      descriptionAr: "خدمات التأشيرات",
      descriptionEn: "Visa services",
      path: "/services/visas",
      icon: FileCheck2,
    },
    {
      _id: "ziyarats",
      titleAr: "الزيارات",
      titleEn: "Ziyarats",
      descriptionAr: "البرامج والزيارات",
      descriptionEn: "Tours and ziyarat programs",
      path: "/services/ziyarats",
      icon: Landmark,
    },
    {
      _id: "extras",
      titleAr: "خدمات إضافية",
      titleEn: "Extras",
      descriptionAr: "الخدمات الإضافية",
      descriptionEn: "Additional services",
      path: "/services/extras",
      icon: CirclePlus,
    },
  ];

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="الخدمات"
        eyebrowEn="Services"
        titleAr="خدماتنا"
        titleEn="Our Services"
        subtitleAr="اختر الخدمة التي ترغب في البحث عنها وحجزها."
        subtitleEn="Choose the service you would like to search and book."
      />
      <UniversalCardsContainer
        items={services}
        lang={isArabic ? "ar" : "en"}
        getTitle={(item) => (isArabic ? item.titleAr : item.titleEn)}
        getSubtitle={(item) =>
          isArabic ? item.descriptionAr : item.descriptionEn
        }
        getImage={() => null}
        getIcon={(item) => {
          const Icon = item.icon;
          return <Icon size={48} className="text-emerald-700" />;
        }}
        getBadges={() => []}
        showStatus={false}
        clickable
        onNavigate={(item) => navigate(item.path)}
      />
    </PublicPageLayout>
  );
}
