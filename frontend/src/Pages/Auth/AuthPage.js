import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../redux/auth/authSlice";
import { useTranslation } from "react-i18next";
import {
  clearError,
  completeGoogleLogin,
  registerUser,
} from "../../redux/auth/authSlice";
import { toast } from "react-toastify";
import { loginWithGoogle } from "../../services/api/admin/auth";
import PublicButton from "../../Components/shared/buttons/PublicButton";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const location = useLocation();
  const returnTo = typeof location.state?.from === "string"
    && location.state.from.startsWith("/")
    && !location.state.from.startsWith("//")
    ? location.state.from
    : "/";

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const googleExchangeStarted = useRef(false);

  const { loading, error, currentUser, TypeAction } = useSelector(
    (state) => state.auth,
  );

  const [registerForm, setregisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState(null);
  const [loginError, setLoginError] = useState(null);

  const handleResiterChange = (e) => {
    setregisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleSubmitRegiter = (e) => {
    e.preventDefault();
    dispatch(clearError());
    setFormError(null);
    if (registerForm.password !== registerForm.confirmPassword)
      return setFormError(t("auth.passwordMismatch"));
    const userData = {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    };

    dispatch(registerUser(userData));
  };

  useEffect(() => {
    if (loading) return;

    if (currentUser && !loading && TypeAction === "register") {
      toast.success("تم التسجيل بنجاح ✅");
      setFormError(null);
      setregisterForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [currentUser, loading, TypeAction]);

  // login logic
  const handleLoginChange = (e) => {
    if (loginError) setLoginError(null);
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLoginError(null);

    try {
      await dispatch(loginUser(loginForm)).unwrap();
      toast.success("تم تسجيل الدخول بنجاح ✅");
      navigate(returnTo, { replace: true });
    } catch (loginFailure) {
      setLoginError(
        typeof loginFailure === "string"
          ? loginFailure
          : loginFailure?.message || t("auth.loginFail"),
      );
    }
  };

  //GOOGLE LOGIN LOCIC
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleStatus = urlParams.get("google");
    if (!googleStatus || googleExchangeStarted.current) return;
    googleExchangeStarted.current = true;
    window.history.replaceState({}, document.title, window.location.pathname);
    const completeGoogleFlow = async ()=>{
      if(googleStatus !== "success") {
        toast.error(isArabic ? "تعذر تسجيل الدخول بحساب Google" : "Unable to login with Google account");
        return
      }
      try {
        await dispatch(completeGoogleLogin()).unwrap();
        toast.success(isArabic ? "تم تسجيل الدخول بنجاح" : "Login successful");
        navigate("/" , { replace: true });// وظيفة replace هو إزالة الصفحة الحالية من سجل التصفح بعد تسجيل الدخول الناجح، مما يمنع المستخدم من العودة إلى صفحة تسجيل الدخول عند الضغط على زر الرجوع في المتصفح.
      }
      catch (error) {
        toast.error(isArabic ? "تعذر تسجيل الدخول بحساب Google" : "Unable to login with Google account");
      }
    } 
    completeGoogleFlow();
   
  }, [dispatch, isArabic, navigate]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12 ${
        i18n.language === "ar" ? "rtl" : "ltr"
      }`}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 bg-white shadow-xl rounded-3xl p-10">
        {/* 🟢 قسم التسجيل */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            {t("auth.createAccount")}
          </h2>

          {(formError || (TypeAction !== "login" && error)) && (
            <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4 shadow">
              {formError || error}
            </div>
          )}
          <form onSubmit={handleSubmitRegiter} className="space-y-5">
            <div>
              <label htmlFor="register-username" className="block text-gray-700 mb-1 font-medium">
                {t("auth.username")}
              </label>
              <input
                type="text"
                id="register-username"
                name="username"
                autoComplete="username"
                required
                value={registerForm.username}
                onChange={handleResiterChange}
                placeholder={t("auth.usernamePlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-gray-700 mb-1 font-medium">
                {t("auth.email")}
              </label>
              <input
                type="email"
                id="register-email"
                name="email"
                autoComplete="email"
                required
                value={registerForm.email}
                onChange={handleResiterChange}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-gray-700 mb-1 font-medium">
                {t("auth.password")}
              </label>
              <input
                type="password"
                id="register-password"
                name="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={registerForm.password}
                onChange={handleResiterChange}
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="block text-gray-700 mb-1 font-medium">
                {t("auth.confirmPassword")}
              </label>
              <input
                type="password"
                id="register-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={6}
                required
                value={registerForm.confirmPassword}
                onChange={handleResiterChange}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <PublicButton
              type="submit"
              loading={loading && TypeAction !== "login"}
              disabled={loading}
              fullWidth
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t("auth.register")}
            </PublicButton>
          </form>
        </div>

        {/* 🟢 قسم تسجيل الدخول */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            {t("auth.welcomeBack")}
          </h2>

          {loginError && (
            <div
              className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4 shadow"
              role="alert"
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmitLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-gray-700 mb-1 font-medium">
                {t("auth.email")}
              </label>
              <input
                type="email"
                id="login-email"
                name="email"
                autoComplete="email"
                required
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full focus:ring-2 focus:ring-green-400 px-4 py-2 border border-gray-300 rounded-lg "
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-gray-700 mb-1 font-medium">
                {t("auth.password")}
              </label>
              <input
                type="password"
                id="login-password"
                name="password"
                autoComplete="current-password"
                required
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>

            <PublicButton
              type="submit"
              loading={loading && TypeAction !== "register"}
              disabled={loading}
              fullWidth
              className="bg-green-600 hover:bg-green-700"
            >
              {t("auth.login")}
            </PublicButton>
          </form>

          {/* زر Google */}
          <PublicButton
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            fullWidth
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            🔗 {t("auth.googleLogin")}
          </PublicButton>

          <div className="text-center mt-4">
            <Link
              to="/forgotPassword"
              className="text-sm text-blue-600 hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
