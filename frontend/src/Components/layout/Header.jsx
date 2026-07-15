import React, { useEffect } from "react";
import { Navbar, Nav, Container, Image } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faUser,
  faGlobe,
  faRightFromBracket,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/auth/authSlice";
import { useTranslation } from "react-i18next";

export default function Header() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const user = currentUser?.user || currentUser;
  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";
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
            src="./assets/images/logo.jpeg"
            alt="logo"
          />
        </Navbar.Brand>

        {/* ✅ روابط التنقل */}

        <Nav className="mx-auto d-flex gap-3">
          <Nav.Link as={Link} to="/">
            {t("Home")}
          </Nav.Link>
          <Nav.Link as={Link} to="/shop">
            {t("shop.title")}
          </Nav.Link>
          <Nav.Link as={Link} to="/ourTeam">
            {t("ourTeam")}
          </Nav.Link>

          <Nav.Link as={Link} to="/aboutUs">
            {t("AboutUs")}
          </Nav.Link>

          {isAdmin && (
            <Nav.Link as={Link} to="/adminDashboard">
              {t("Dashboad")}
            </Nav.Link>
          )}

          {isAdmin && (
            <Nav.Link as={Link} to="/admin">
              {lang === "ar" ? "لوحة الاعدادات" : "Settings"}
            </Nav.Link>
          )}

          {!currentUser && (
            <Nav.Link as={Link} to="/authpage">
              {t("SignIn")}
            </Nav.Link>
          )}

          <Nav.Link disabled>{t("Disabled")}</Nav.Link>
        </Nav>

        {/* ✅ أيقونات ويمين الهيدر */}
        <div className="d-flex align-items-center gap-3 position-relative">
          {currentUser && (
            <Nav.Link
              as={Link}
              to="/myBookings"
              className="btn btn-info text-white"
            >
              {t("myOrders")}
            </Nav.Link>
          )}

          {/* ✅ إذا كان المستخدم أدمن، نعرض أيقونة الداشبورد */}

          {isAdmin && (
            <NavLink className="btn btn-light" as={Link} to="/adminDashboard">
              {t("Dashboad")}
            </NavLink>
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
              src={
                currentUser.profileImage.startsWith("http")
                  ? currentUser.profileImage
                  : `http://localhost:5000/${currentUser.profileImage}`
              }
              width={40}
              height={40}
              roundedCircle
              onClick={() => navigate("/profile")}
              className="cursor-pointer"
            />
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              onClick={() => navigate("/profile")}
              className="text-white fs-5 cursor-pointer"
            />
          )}

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

          <FontAwesomeIcon
            onClick={() => navigate("/favoritesPage")}
            icon={faHeart}
            className="text-white fs-5 cursor-pointer"
          />

          <div className="d-flex align-items-center gap-1">
            <FontAwesomeIcon
              onClick={toggleLanguage}
              icon={faGlobe}
              className="text-white fs-5 cursor-pointer"
            />
            <span
              onClick={toggleLanguage}
              className=" fw-bold cursor-pointer text-white"
            >
              {i18n.language === "ar" ? "AR" : "EN"}
            </span>
          </div>

          {currentUser && (
            <FontAwesomeIcon
              onClick={handleLogout}
              icon={faRightFromBracket}
              className="text-white fs-5 cursor-pointer"
            />
          )}
        </div>
      </Container>
    </Navbar>
  );
}
