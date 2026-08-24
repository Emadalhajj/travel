import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PublicButton from "../../Components/shared/buttons/PublicButton";
import { requestPasswordReset, resetPassword } from "../../services/api";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function PasswordRecoveryPage() {
  const { token } = useParams();
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar").startsWith("ar");
  const isReset = Boolean(token);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (event) => {
    setError("");
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isReset && form.password !== form.confirmPassword) {
      setError(isArabic ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = isReset
        ? await resetPassword(token, form.password, form.confirmPassword)
        : await requestPasswordReset(form.email);
      setMessage(response.data.message);
      setForm({ email: "", password: "", confirmPassword: "" });
    } catch (requestError) {
      setError(getErrorMessage(
        requestError,
        isArabic ? "تعذر إكمال العملية، حاول مرة أخرى" : "Unable to complete the request",
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16" dir={isArabic ? "rtl" : "ltr"}>
      <section className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="mb-3 text-2xl font-bold text-slate-900">
          {isReset
            ? (isArabic ? "تعيين كلمة مرور جديدة" : "Set a new password")
            : (isArabic ? "نسيت كلمة المرور" : "Forgot password")}
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          {isReset
            ? (isArabic ? "أدخل كلمة مرور جديدة لا تقل عن 6 أحرف." : "Enter a new password of at least 6 characters.")
            : (isArabic ? "أدخل بريدك وسنرسل إليك رابطًا صالحًا لمدة 15 دقيقة." : "Enter your email and we will send a link valid for 15 minutes.")}
        </p>

        {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isReset ? (
              <label className="block font-medium text-slate-700">
                {isArabic ? "البريد الإلكتروني" : "Email"}
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            ) : (
              <>
                <label className="block font-medium text-slate-700">
                  {isArabic ? "كلمة المرور الجديدة" : "New password"}
                  <input type="password" name="password" value={form.password} onChange={updateField} required minLength={6} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
                </label>
                <label className="block font-medium text-slate-700">
                  {isArabic ? "تأكيد كلمة المرور" : "Confirm password"}
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} required minLength={6} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
                </label>
              </>
            )}
            <PublicButton type="submit" loading={loading} fullWidth>
              {isReset
                ? (isArabic ? "حفظ كلمة المرور" : "Save password")
                : (isArabic ? "إرسال رابط الاستعادة" : "Send recovery link")}
            </PublicButton>
          </form>
        )}

        <Link to="/authpage" className="mt-6 block text-center text-sm font-medium text-emerald-700">
          {isArabic ? "العودة إلى تسجيل الدخول" : "Back to login"}
        </Link>
      </section>
    </main>
  );
}
