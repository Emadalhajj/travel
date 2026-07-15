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

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import NotificationsDropdown from "../../Components/ui/NotificationsDropdown";

export default function AllProducts() {
  const { t, i18n } = useTranslation();
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
            {/* //visas */}
            <Col md={{ span: 12 }}>
              <Link to="/adminVisaList">
                <Button variant="success" className="w-50">
                  {t("adminDashboard.visa_management")}
                </Button>
              </Link>
            </Col>

            {/* Transportions */}
            <Col md={{ span: 12 }}>
              <Link to="/adminTransportList">
                <Button variant="primary" className="w-50">
                  {t("adminDashboard.Transportions_management")}
                </Button>
              </Link>
            </Col>
            {/* hotels */}

            <Col md={{ span: 12 }}>
              <Link to="/adminHotelList">
                <Button variant="dark" className="w-50">
                  {t("adminDashboard.Hotels_management")}
                </Button>
              </Link>
            </Col>

            {/* Tousem */}
            <Col md={{ span: 12 }}>
              <Link to="/admin/users">
                <Button variant="dark" className="w-50">
                  {t("adminDashboard.Tousem_management")}
                </Button>
              </Link>
            </Col>

            {/*  */}
          </Row>
        </Card>

        {/* <AdminChatPanel adminToken={adminToken} onNewConversation={handleNewConversation} /> */}
      </div>
    </Container>
  );
}
