import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { HomePage } from "./pages/HomePage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { ContactSettingsPage } from "./pages/admin/ContactSettingsPage";
import { ImageManagementPage } from "./pages/admin/ImageManagementPage";
import { PaymentSettingsPage } from "./pages/admin/PaymentSettingsPage";
import { WatermarkPage } from "./pages/admin/WatermarkPage";

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  ),
});

// Public routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

// Admin routes
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: ImageManagementPage,
});

const adminWatermarkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/watermark",
  component: WatermarkPage,
});

const adminPaymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/payment",
  component: PaymentSettingsPage,
});

const adminContactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/contact",
  component: ContactSettingsPage,
});

// Route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  adminLoginRoute,
  adminRoute,
  adminWatermarkRoute,
  adminPaymentRoute,
  adminContactRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
