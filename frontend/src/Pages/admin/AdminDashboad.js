import axios from "axios";

import React, { useEffect, useState } from "react";
import {
  Button,
  div,
  Container,
  Form,
  Card,
  Row,
  Table,
  Col,
  Spinner,
  FormLabel,
} from "react-bootstrap";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   BarChart,
//   XAxis,
//   YAxis,
//   Bar,
//   LineChart,
//   Line,
//   Label,
// } from "recharts";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import AdminChatPanel from "../Components/AdminChatPanel";
// import { Bell } from "lucide-react"; // أيقونة جرس التنبيه
// import { useAdminSocket } from "../hooks/useAdminSocket";
import NotificationsDropdown from "../../Components/ui/NotificationsDropdown";
// import { initSocket, getSocket, joinConversation } from "../services/socket";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // for chat and notifications bell
  const adminToken = localStorage.getItem("token"); // تأكد من أن التوكن مخزن في localStorage
  const [notifications, setNotifications] = useState([]); // حالة التنبيهات
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleNewConversation = (data) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        userId: data.userId,
        conversationId: data.conversationId,
        time: new Date().toLocaleTimeString(),
        lastMessage: data.lastMessage || "محادثة جديدة",
      },
      ...prev,
    ]);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      console.log("Params being sent:", params);
      const { data } = await axios.get("/api/admin/statistics", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  // تهيئة Socket عند تحميل الصفحة
  //   useEffect(() => {
  //     const token = localStorage.getItem("token"); // توكن الأدمن
  //     const socket = initSocket(null, token, "admin");
  //      // الاستماع للرسائل الجديدة
  //     socket.on("newMessage", (msg) => {
  //       console.log("Received newMessage:", msg);

  //       // تحديث الرسائل إذا كانت المحادثة مفتوحة
  //       if (msg.conversationId === selectedConversationId) {
  //         setMessages((prev) => [...prev, msg]);
  //       }
  //     });
  //         return () => {
  //       socket.off("newMessage");
  //     };
  //   }, [selectedConversationId]);
  //     // عند اختيار محادثة من القائمة
  //   const handleSelectConversation = (conversationId) => {
  //     setSelectedConversationId(conversationId);
  //     const socket = getSocket();
  //     joinConversation(conversationId);
  //   };

  // useEffect(() => {
  //   if (!socket) return;

  //   // عند استقبال رسالة جديدة من المستخدم أو الأدمن
  //   socket.on("newMessage", (message) => {
  //     console.log("📩 رسالة جديدة وصلت:", message);

  //     // إذا كانت الرسالة تخص المحادثة المفتوحة حاليًا، أضفها مباشرة
  //     setMessages((prev) => {
  //       // تجنب التكرار إذا كانت نفس الرسالة
  //       if (prev.some((m) => m._id === message._id)) return prev;
  //       return [...prev, message];
  //     });
  //   });

  //   // تنظيف عند إلغاء المكون
  //   return () => {
  //     socket.off("newMessage");
  //   };
  // }, [socket]);

  // ضبط اللغة والاتجاه بناءً على localStorage

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "en";
    i18n.changeLanguage(savedLang);
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = savedLang;
  }, [i18n]);

  //تحديث الإحصائيات عند تحميل الصفحة
  const handleFilterClick = () => {
    fetchStats();
    if (loading) {
      return (
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
        </Container>
      );
    }
    // setLoading(true); // هذا يجعل سبينر يظهر أثناء تحميل الفلترة!

    if (!stats) {
      return (
        <Container className="text-center py-5">
          <p>تعذر تحميل الإحصائيات</p>
        </Container>
      );
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container className="text-center py-5">
        <p>تعذر تحميل الإحصائيات</p>
      </Container>
    );
  }

  //الرسم البياني

  const COLORS = ["#28a745", "#dc3545"];

  const chartData = [
    {
      name: t("adminDashboard.delivered_status"),
      value: stats.deliveredOrders,
    },
    { name: t("adminDashboard.pending_status"), value: stats.pendingOrders },
  ];

  //   <Pie
  //     data={chartData}
  //     cx="50%"
  //     cy="50%"
  //     label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
  //     labelLine={false}
  //     outerRadius={80}
  //     labelPosition="outside"
  //   ></Pie>;

  return (
    <Container className="mt-5">
      <h2 className="mb-4">{t("adminDashboard.dashboard_title")}</h2>
      {/* // قسم التنبيهات والدردشة  */}
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
          <NotificationsDropdown notifications={notifications} />
        </div> */}

        <Card className="p-4 shadow rounded-4 ">
          <Row className="gy-3">
            <Col md={{ span: 12 }}>
              <Link to="/adminOrdersDashboard">
                <Button variant="success" className="w-50">
                  {t("adminDashboard.orders_management")}
                </Button>
              </Link>
            </Col>

            <Col md={{ span: 12 }}>
              <Link to="/allProducts">
                <Button variant="primary" className="w-50">
                   {t("adminDashboard.products_management")}
                </Button>
              </Link>
            </Col>

            <Col md={{ span: 12 }}>
              <Link to="/admin/users">
                <Button variant="dark" className="w-50">
                  {t("adminDashboard.users_management")}
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>

        {/* <Row className="py-4">
          <Col>
            <FormLabel>{t("adminDashboard.from_date_label")}</FormLabel>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Col>
          <Col md={5}>
            <FormLabel>{t("adminDashboard.to_date_label")}</FormLabel>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
            />
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button
              className="btn btn-primary w-100"
              onClick={handleFilterClick}
            >
              {t("adminDashboard.filter_button")}
            </Button>
          </Col>
        </Row> */}

        <h2 className="mb-4 py-5 fw-bold">
          {t("adminDashboard.statistics_title")}
        </h2>
        {/* <Row className="g-4">
          <Col md={4}>
            <Card bg="primary" text="white" className="text-center shadow">
              <Card.Body>
                <Card.Title>
                  {t("adminDashboard.total_orders_title")}
                </Card.Title>
                <Card.Text className="fs-3">{stats.totalOrders}</Card.Text>
                <Link
                  className="btn btn-light"
                  to={`/adminOrdersDashboard?startDate=${startDate}&endDate=${endDate}&isPaid=true`}
                >
                  {t("adminDashboard.view_details")}
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg="success" text="white" className="text-center shadow">
              <Card.Body>
                <Card.Title>{t("adminDashboard.total_users_title")}</Card.Title>
                <Card.Text className="fs-3">{stats.totalUsers}</Card.Text>
                <Link
                  to={`/admin/users?startDate=${startDate}&endDate=${endDate}&isDelivered=true`}
                  className="btn btn-light mt-2"
                >
                  {t("adminDashboard.view_details")}
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg="info" text="white" className="text-center shadow">
              <Card.Body>
                <Card.Title>
                  {t("adminDashboard.total_products_title")}
                </Card.Title>
                <Card.Text className="fs-3">{stats.totalProducts}</Card.Text>
                <Link
                  to={`/admin/products?startDate=${startDate}&endDate=${endDate}&isDelivered=true`}
                  className="btn btn-light mt-2"
                >
                  {t("adminDashboard.view_details")}
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg="warning" text="dark" className="text-center shadow">
              <Card.Body>
                <Card.Title>
                  {t("adminDashboard.total_revenue_title")}
                </Card.Title>
                <Card.Text className="fs-3">
                  {(stats.totalRevenue || 0).toLocaleString()}{" "}
                  {t("adminDashboard.currency")}
                </Card.Text>
                <Link className="btn btn-light mt-2">
                  {t("adminDashboard.view_details")}
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg="success" text="white" className="text-center shadow">
              <Card.Body>
                <Card.Title>
                  {t("adminDashboard.delivered_orders_title")}
                </Card.Title>
                <Card.Text className="fs-3">{stats.deliveredOrders}</Card.Text>
                <Link
                  to={`/adminOrdersDashboard?startDate=${startDate}&endDate=${endDate}&isDelivered=true`}
                  className="btn btn-light mt-2"
                >
                  {t("adminDashboard.view_details")}
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg="danger" text="white" className="text-center shadow">
              <Card.Body>
                <Card.Title>
                  {t("adminDashboard.pending_orders_title")}
                </Card.Title>
                <Card.Text className="fs-3">{stats.pendingOrders}</Card.Text>
                <Link
                  to={`/adminOrdersDashboard?startDate=${startDate}&endDate=${endDate}&isDelivered=false`}
                  className="btn btn-light mt-2"
                >
                  {t("adminDashboard.view_details")}
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row> */}

        {/* <Row>
          <h3 className="text-center mt-5 mb-3">
            {t("adminDashboard.order_status_distribution")}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Row> */}

        {/* <AdminChatPanel adminToken={adminToken} onNewConversation={handleNewConversation} /> */}
      </div>
    </Container>
  );
}
