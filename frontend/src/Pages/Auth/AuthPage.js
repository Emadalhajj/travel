import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../redux/auth/authSlice";
import { useTranslation } from "react-i18next";
import {
  clearError,
  registerUser,
  setCurrentUser,
} from "../../redux/auth/authSlice";
import { toast } from "react-toastify";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  const [Error, setError] = useState(null);

  const handleResiterChange = (e) => {
    setregisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleSubmitRegiter = (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (registerForm.password !== registerForm.confirmPassword)
      return setError(t("auth.passwordMismatch"));
    const userData = {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    };

    dispatch(registerUser(userData));
  };

  useEffect(() => {
    if (loading) return;

    if (error) {
      dispatch(clearError());
      return;
    }

    if (currentUser && !loading && TypeAction === "register") {
      toast.success("تم التسجيل بنجاح ✅");
      setError(null);
      setregisterForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    }
    if (currentUser && !loading && TypeAction === "login") {
      toast.success("تم تسجيل الدخول بنجاح ✅");
      navigate("/");
    }
  }, [currentUser, loading, error, TypeAction, navigate, dispatch]);

  // login logic
  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };
  const handleSubmitLogin = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(loginUser(loginForm));
  };

  //GOOGLE LOGIN LOCIC
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userParam = urlParams.get("user");

    // console.log("AuthPage token:", token); // للتحقق
    // console.log("AuthPage userParam:", userParam); // للتحقق

    if (token) {
      let userObj = { token };
      if (userParam) {
        try {
          userObj = JSON.parse(decodeURIComponent(userParam));
          // console.log("Parsed userObj:", userObj); // للتحقق
        } catch (err) {
          console.error("Error parsing userParam:", err);
          // keep userObj as { token }
        }
      }

      localStorage.setItem("currentUser", JSON.stringify(userObj));
      localStorage.setItem("token", token);

      // تحديث Redux
      dispatch(setCurrentUser({ user: userObj }));

      toast.success("تم تسجيل الدخول بحساب Google ✅");
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate("/");
    }
  }, [navigate, dispatch]);

  //   const [form, setForm] = useState({
  //     username: "",
  //     email: "",
  //     password: "",
  //     confirmPassword: "",
  //   });

  //   const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  //   const [error, setError] = useState(null);
  //   const [success, setSuccess] = useState(null);

  //     // 🔹 تحديث الحقول
  //   const handleChange = (e) =>
  //     setForm({ ...form, [e.target.name]: e.target.value });
  //   const handleLoginChange = (e) =>
  //     setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  //   const handleRegister = async (e) => {
  //     e.preventDefault();
  //     if (form.password !== form.confirmPassword)
  //       return setError(t("auth.passwordMismatch"));

  //     try {
  //       const res = await axios.post(
  //         "http://localhost:5000/api/users/register",
  //         form
  //       );
  //       setSuccess(res.data.message);
  //       setError(null);
  //       setForm({ username: "", email: "", password: "", confirmPassword: "" });
  //     } catch (err) {
  //       setError(err.response?.data?.message || t("auth.registerFail"));
  //     }
  //   };

  //   const handleLogin = async (e) => {
  //     e.preventDefault();

  //     try {
  //       const res = await axios.post("http://localhost:5000/api/users/login", {
  //         email: loginForm.email,
  //         password: loginForm.password,
  //       });

  //       const user = res.data.user;
  //       const token = res.data.token;

  //       localStorage.setItem("currentUser", JSON.stringify(user));
  //       localStorage.setItem("token", token);
  //       setUser(user);

  //       dispatch(loginUser(loginForm));
  //       alert(`${t("auth.welcome")} ${user.username}!`);

  //       navigate("/");
  //     } catch (err) {
  //       alert(err.response?.data?.message || t("auth.loginFail"));
  //     }
  //   };

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

          {error && (
            <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4 shadow">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmitRegiter} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                {t("auth.username")}
              </label>
              <input
                type="text"
                name="username"
                value={registerForm.username}
                onChange={handleResiterChange}
                placeholder={t("auth.usernamePlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                {t("auth.email")}
              </label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleResiterChange}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                {t("auth.password")}
              </label>
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleResiterChange}
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                {t("auth.confirmPassword")}
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleResiterChange}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {t("auth.register")}
            </button>
          </form>
        </div>

        {/* 🟢 قسم تسجيل الدخول */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            {t("auth.welcomeBack")}
          </h2>

          <form onSubmit={handleSubmitLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                {t("auth.email")}
              </label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full focus:ring-2 focus:ring-green-400 px-4 py-2 border border-gray-300 rounded-lg "
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                {t("auth.password")}
              </label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              {t("auth.login")}
            </button>
          </form>

          {/* زر Google */}
          <a
            href="http://localhost:5000/api/auth/google"
            className="block text-center mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            🔗 {t("auth.googleLogin")}
          </a>

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
