// src/components/common/ConfirmDialog.jsx



import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle, Trash2, Archive, Ban, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const iconMap = {
  delete: Trash2,
  archive: Archive,
  block: Ban,
  success: CheckCircle,
  warning: AlertTriangle,
};

const colorMap = {
  delete: 'danger',
  archive: 'warning',
  block: 'dark',
  success: 'success',
  warning: 'warning',
  default: 'primary',
};

export default function ConfirmDialog({
  show,
  onHide,
  onConfirm,
  title = "تأكيد العملية",
  message = "هل أنت متأكد من هذه العملية؟ لا يمكن التراجع عنها.",
  confirmText = "نعم، تأكيد",
  cancelText = "إلغاء",
  variant = "delete", // delete | archive | block | success | warning
  loading = false,
  icon: CustomIcon,
}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const Icon = CustomIcon || iconMap[variant] || AlertTriangle;
  const color = colorMap[variant] || colorMap.default;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="md">
      <Modal.Body className="p-5 text-center">
        <div className="d-flex flex-column align-items-center gap-4">
          {/* الأيقونة الدائرية الملونة */}
          <div
            className={`rounded-circle p-4 d-inline-flex align-items-center justify-content-center
              ${color === 'danger' ? 'bg-danger-subtle text-danger' :
                color === 'warning' ? 'bg-warning-subtle text-warning' :
                color === 'success' ? 'bg-success-subtle text-success' :
                'bg-primary-subtle text-primary'}`}
            style={{ width: '80px', height: '80px' }}
          >
            <Icon size={40} strokeWidth={2.5} />
          </div>

          {/* العنوان */}
          <h5 className="fw-bold text-dark">{title}</h5>

          {/* الرسالة */}
          <p className="text-muted fs-6 mb-0" style={{ maxWidth: '400px' }}>
            {message}
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 justify-content-center gap-3 pb-4">
        <Button
          variant="light"
          onClick={onHide}
          disabled={loading}
          size="lg"
          className="px-4"
        >
          {cancelText}
        </Button>

        <Button
          variant={color}
          onClick={onConfirm}
          disabled={loading}
          size="lg"
          className="px-5 d-flex align-items-center gap-2"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              {isArabic ? "جاري المعالجة..." : "Processing..."}
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/*

<ConfirmDialog variant="delete"   title="حذف المنتج"        confirmText="حذف نهائي" />
<ConfirmDialog variant="archive"  title="أرشفة الجولة"       confirmText="أرشفة" />
<ConfirmDialog variant="block"    title="حظر المستخدم"       confirmText="حظر" />
<ConfirmDialog variant="success"  title="تأكيد الحجز"        confirmText="تأكيد" />
<ConfirmDialog variant="warning"  title="إلغاء الحجز"        confirmText="إلغاء الحجز" />


*/
