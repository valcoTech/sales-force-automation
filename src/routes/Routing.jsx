import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import LoginRedirect from "../pages/LoginRedirect.jsx";

import Login from "../pages/Login.jsx";
import NewOrder from "../pages/NewOrder.jsx";

import SalesmanDashboard from "../pages/SalesmanDashboard.jsx";
import SupervisorDashboard from "../pages/SupervisorDashboard.jsx";
import AdminSalesDashboard from "../pages/AdminSalesDashboard.jsx";
import AdminClaimDashboard from "../pages/AdminClaimDashboard.jsx";
import StockUpload from "../pages/StockUpload.jsx";

export const Routing = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/redirect" replace />,
  },
  {
    path: "/redirect",
    element: <LoginRedirect />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/salesman/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["salesman"]}>
        <DashboardLayout>
          <SalesmanDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/salesman/order",
    element: (
      <ProtectedRoute allowedRoles={["salesman"]}>
        <DashboardLayout>
          <NewOrder />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/order",
    element: (
      <ProtectedRoute allowedRoles={["salesman"]}>
        <DashboardLayout>
          <NewOrder />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <DashboardLayout>
          <SupervisorDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin-sales/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin_sales"]}>
        <DashboardLayout>
          <AdminSalesDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin-claim/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin_claim"]}>
        <DashboardLayout>
          <AdminClaimDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/stock-upload",
    element: (
      <ProtectedRoute allowedRoles={["admin_sales", "supervisor"]}>
        <DashboardLayout>
          <StockUpload />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/redirect" replace />,
  },
]);
