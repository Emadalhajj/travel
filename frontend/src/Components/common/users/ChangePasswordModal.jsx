import React, { useState } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { changePassword as changePasswordUser } from "../../../redux/auth/usersSlice";
import { changePassword as changePasswordOwn } from "../../../redux/auth/authSlice";
import PasswordInput from "../PasswordInput";

export default function ChangePasswordModal({
  show,
  onHide,
  userId, // معرف المستخدم المختار
  userName, // اسم المستخدم للعرض (اختياري)
  onSuccess, // callback بعد النجاح (اختياري)
  requireCurrentPassword = false, // (الافتراضي false للأدمن)
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const dispatch = useDispatch();

  const handleSubmit = async () => {
    // تنظيف المدخلات
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    const trimmedCurrent = currentPassword.trim();

    if (!trimmedNew || !trimmedConfirm) {
      toast.error(
        lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields",
      );
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      toast.error(
        lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
      );
      return;
    }

    if (trimmedNew.length < 6) {
      toast.error(
        lang === "ar"
          ? "كلمة المرور يجب أن تكون أكثر من 6 أحرف"
          : "Password must be more than 6 characters",
      );
      return;
    }

    if (requireCurrentPassword && !trimmedCurrent) {
      toast.error(
        lang === "ar"
          ? "يرجى إدخال كلمة المرور الحالية"
          : "Please enter your current password",
      );
      return;
    }

    setLoading(true);

    try {
      if (userId) {
        await dispatch(
          changePasswordUser({ id: userId, password: trimmedNew }),
        ).unwrap();
      } else {
        const payload = {
          currentPassword: requireCurrentPassword ? trimmedCurrent : undefined,
          newPassword: trimmedNew,
          confirmNewPassword: trimmedConfirm,
        };
        // إزالة currentPassword إذا لم يكن مطلوبًا
        if (!requireCurrentPassword) {
          delete payload.currentPassword;
        }
        await dispatch(changePasswordOwn(payload)).unwrap();
      }

      toast.success(
        lang === "ar"
          ? "تم تغيير كلمة المرور بنجاح"
          : "Password changed successfully",
      );

      if (typeof onSuccess === "function") onSuccess();

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onHide();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.data?.message ||
          err?.message ||
          (lang === "ar"
            ? "فشل تغيير كلمة المرور"
            : "Failed to change password"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title>
          {lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          {userName && <small className="text-muted ms-2">({userName})</small>}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {requireCurrentPassword && (
            // <Form.Group className="mb-3">
            //   <Form.Label>
            //     {lang === "ar" ? "كلمة المرور الحالية" : "Current Password"}
            //   </Form.Label>
            //   <Form.Control
            //     type="password"
            //     value={currentPassword}
            //     onChange={(e) => setCurrentPassword(e.target.value)}
            //     placeholder={
            //       lang === "ar"
            //         ? "أدخل كلمة المرور الحالية"
            //         : "Enter current password"
            //     }
            //     required
            //     disabled={loading}
            //   ></Form.Control>
            // </Form.Group>
            <PasswordInput
              label={
                lang === "ar"
                  ? "أدخل كلمة المرور الحالية"
                  : "Enter current password"
              }
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "أدخل كلمة المرور الحالية"
                  : "Enter current password"
              }
              required
              disabled={loading}
              autoFocus
            />
          )}
          {/* كلمة المرور الجديدة */}

          {/* <Form.Group className="mb-3">
            <Form.Label>
              {lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}
            </Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "أدخل كلمة المرور الجديدة"
                  : "Enter new password"
              }
              autoFocus
              disabled={loading}
            />
          </Form.Group> */}
          <PasswordInput
            label={lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={
              lang === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"
            }
            required
            disabled={loading}
            autoFocus={!requireCurrentPassword} // يركز هنا إذا ما طلبش الحالية
          />
          {/* تأكيد كلمة المرور الجديدة */}
          <PasswordInput
            label={lang === "ar" ? "تأكيد كلمة المرور" : "Confirm New Password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={
              lang === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter new password"
            }
            required
            disabled={loading}
          />
          {/* <Form.Group className="mb-3">
            <Form.Label>
              {lang === "ar" ? "تأكيد كلمة المرور" : "Confirm New Password"}
            </Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "أعد إدخال كلمة المرور"
                  : "Re-enter new password"
              }
              disabled={loading}
            />
          </Form.Group> */}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          {lang === "ar" ? "إلغاء" : "Cancel"}
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {lang === "ar" ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : lang === "ar" ? (
            "حفظ التغييرات"
          ) : (
            "Save Changes"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
