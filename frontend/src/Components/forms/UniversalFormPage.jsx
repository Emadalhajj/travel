/*
=========================================================
UniversalFormPage.jsx
=========================================================

Wrapper لعرض الفورم داخل صفحة مستقلة

المسؤوليات:
---------------------------------------------------------
1- Layout الصفحة
2- العنوان
3- breadcrumbs مستقبلاً
4- actions خاصة بالصفحة
5- تمرير البيانات إلى UniversalForm

مهم:
---------------------------------------------------------
لا يحتوي منطق الفورم.
كل المنطق داخل UniversalForm.

=========================================================
*/

import React, { forwardRef, useImperativeHandle, useRef } from "react";

import { Container, Card, Button } from "react-bootstrap";

import { useTranslation } from "react-i18next";

/*
=========================================================
Universal Form
=========================================================
*/

import UniversalForm from "./UniversalForm";

/*
=========================================================
Component
=========================================================
*/

const UniversalFormPage = forwardRef(function UniversalFormPage({
  /*
  =========================================================
  Page Data
  =========================================================
  */

  titleAr = "إضافة",

  titleEn = "Create",

  /*
  =========================================================
  Form
  =========================================================
  */

  config,

  initialData,

  onSave,

  errors,

  loading,

  /*
  =========================================================
  Optional
  =========================================================
  */

  onCancel,
}, ref) {
  //============ re
  const formRef = useRef();

  useImperativeHandle(ref, () => ({
    getValues: () => formRef.current?.getValues?.() || {},
    getPayload: () =>
      formRef.current?.getPayload?.() || {
        formState: {},
        imageState: {},
      },
    submit: () => formRef.current?.submit?.(),
  }));

  /*
  =========================================================
  Language
  =========================================================
  */

  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  /*
  =========================================================
  Render
  =========================================================
  */

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm border-0 rounded-4">
        {/* =========================================
            Header
        ========================================= */}

        <Card.Header className="bg-white border-bottom py-3">
          <h4 className="mb-0 fw-bold">{isArabic ? titleAr : titleEn}</h4>
        </Card.Header>

        {/* =========================================
            Body
        ========================================= */}

        <Card.Body>
          <UniversalForm
            ref={formRef}
            config={config}
            initialData={initialData}
            errors={errors}
            onSave={onSave}
          />
        </Card.Body>

        {/* =========================================
            Footer
        ========================================= */}

        <Card.Footer className="bg-light border-top py-3">
          <div className="d-flex gap-3">
            <Button
              variant="primary"
              disabled={loading}
              onClick={() => formRef.current?.submit()}
            >
              {loading
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "حفظ"
                  : "Save"}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Container>
  );
});

export default UniversalFormPage;
