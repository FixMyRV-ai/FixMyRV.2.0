import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import AuthLayout from "./pages/auth/layout";
import ForgotPassword from "./pages/auth/forgotPassword";
import Dashboard from "./pages/admin/dasboard";
import AdminLayout from "./pages/admin/layout";
import Users from "./pages/admin/users";
import Organizations from "./pages/admin/organizations";
import Transactions from "./pages/admin/transactions";
import TransactionStatsPage from "./pages/admin/transactions/stats";
import Setting from "./pages/admin/setting";
import ContentManagement from "./pages/admin/content";
import Auth from "./components/auth";
import NotFound from "@/pages/notFound";
import ChatLayout from "./pages/user/chat/chatLayout";
import InitialChatScreen from "./pages/user/chat/initialChatScreen";
import Plans from "./pages/admin/plans";
import SubscriptionDetails from "./pages/settings/subscription";
import Subscription from "./pages/user/subscription";
import PaymentSuccess from "./pages/user/paymentSuccess";
import SettingsLayout from "./pages/settings";
import ProfileSettings from "./pages/settings/profile/profile";
import ResetPassword from "./pages/auth/resetPassword";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Auth isAuth={false}>
        <AuthLayout />
      </Auth>
    ),
    children: [
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },   {
        path: "/reset-password",
        element: <ResetPassword />,
    },
    ],
  },
  {
    path: "payment/success",
    element: (
      <Auth isAuth={true}>
        <PaymentSuccess />
      </Auth>
    ),
  },
  {
    path: "upgrade",
    element: (
      <Auth isAuth={true}>
        <Subscription />
      </Auth>
    ),
  },
  {
    path: "/chat",
    element: (
      <Auth isAuth={true} isPro={true}>
        <ChatLayout />
      </Auth>
    ),
    children: [
      {
        path: "new",
        element: <InitialChatScreen />,
      },
      {
        path: ":id",
        element: <InitialChatScreen />,
      },
    ],
  },
  {
    path: "/settings",
    element: (
      <Auth isAuth={true}>
        <SettingsLayout />
      </Auth>
    ),
    children: [
      {
        path: "profile",
        element: <ProfileSettings />,
      },
      {
          path: "",
          element: <Navigate to="profile" replace />
      },
      {
        path: "subscription",
        element: <SubscriptionDetails />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <Auth isAdmin={true}>
        <AdminLayout />
      </Auth>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "organizations",
        element: <Organizations />,
      },
      {
        path: "transactions",
        element: <Transactions />,
      },
      {
        path: "transactions/stats",
        element: <TransactionStatsPage />,
      },
      {
        path: "settings",
        element: <Setting />,
      },
      {
        path: "content",
        element: <ContentManagement />,
      },
      {
        path: "plans",
        element: <Plans />,
      },
      {
        path: "profile",
        element: <ProfileSettings />
    },
    ]
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
