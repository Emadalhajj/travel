import React, { useEffect } from "react";
import { Navbar, Nav, Container, Image } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGlobe,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../redux/auth/authSlice";
import { useTranslation } from "react-i18next";
import useAuthorization from "../../hooks/auth/useAuthorization";
import { formatImagePath } from "../../Utils/imageUtils";

export default function Header() {
  const { user, isAdmin } = useAuthorization();
  const currentUser = user;
  // const items = useSelector((state) => state.cart.items) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";

  // تبديل اللغة
  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "en";
    i18n.changeLanguage(savedLang);
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = savedLang;
  }, [i18n]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/authpage");
  };

  return (
    <Navbar expand="lg" bg="dark" variant="dark" className="px-3">
      <Container
        fluid
        className="d-flex justify-content-between align-items-center"
      >
        {/* ✅ الشعار */}

        <Navbar.Brand as={Link} to="/">
          <img
            style={{ width: "35px" }}
            src="/favicon.ico"
            alt={lang === "ar" ? "الصفحة الرئيسية" : "Home"}
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="primary-navigation" />

        {/* ✅ روابط التنقل */}

        <Navbar.Collapse id="primary-navigation">
          <Nav className="mx-auto gap-3">
            <Nav.Link as={Link} to="/">
              {t("home")}
            </Nav.Link>
            <Nav.Link as={Link} to="/programs">
              {lang === "ar" ? "البرامج" : "Programs"}
            </Nav.Link>
            <Nav.Link as={Link} to="/services">
              {lang === "ar" ? "الخدمات" : "Services"}
            </Nav.Link>
            {isAdmin && (
              <Nav.Link as={Link} to="/admin">
                {lang === "ar" ? "لوحة الإدارة" : "Admin"}
              </Nav.Link>
            )}
          </Nav>

        {/* ✅ أيقونات ويمين الهيدر */}
          <div className="d-flex flex-wrap align-items-center gap-3 position-relative">
          {currentUser && (
            <Nav.Link
              as={Link}
              to="/my-bookings"
              className="btn btn-info text-white"
            >
              {t("myOrders")}
            </Nav.Link>
          )}

          {/* ✅ إذا كان المستخدم لم يسجل دخول، نعرض زر Login */}

          {!currentUser ? (
            <Nav.Link as={Link} to="/authpage">
              {t("SignIn")}
            </Nav.Link>
          ) : (
            <span className="text-white fw-bold">
              {t("welcome")} {user?.username}
            </span>
          )}

          {/* صورة المستخدم */}
          {currentUser?.profileImage ? (
            <Image
              key={currentUser.profileImage}
              src={formatImagePath(currentUser.profileImage)}
              alt={t("profileImage", "صورة الملف الشخصي")}
              width={40}
              height={40}
              roundedCircle
              onClick={() => navigate("/profile")}
              className="cursor-pointer"
            />
          ) : currentUser ? (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-white"
              aria-label={t("profile", "Profile")}
              onClick={() => navigate("/profile")}
            >
              <FontAwesomeIcon icon={faUser} className="fs-5" />
            </button>
          ) : null}

          {/* ShoppingCart */}

          {/* <div className="position-relative">
            <FontAwesomeIcon
              onClick={() => navigate("/cartPage")}
              icon={faShoppingCart}
              className="text-white fs-5 cursor-pointer"
            />
            {items.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  [i18n.language === "ar" ? "left" : "right"]: "-10px", // ✅ يتغير حسب اللغة
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {items.length}
              </span>
            )}
          </div> */}

          <button
            type="button"
            onClick={toggleLanguage}
            className="d-flex align-items-center gap-1 border-0 bg-transparent p-0 fw-bold text-white"
            aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <FontAwesomeIcon icon={faGlobe} className="fs-5" />
            <span>{i18n.language === "ar" ? "AR" : "EN"}</span>
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={handleLogout}
              className="border-0 bg-transparent p-0 text-white"
              aria-label={t("logout")}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="fs-5" />
            </button>
          )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
