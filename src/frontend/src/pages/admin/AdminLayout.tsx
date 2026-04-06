import { Button } from "@/components/ui/button";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  CreditCard,
  Grid2x2,
  Home,
  Images,
  LogOut,
  Menu,
  MessageCircle,
  Stamp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (!loggedIn) {
      navigate({ to: "/admin/login" });
    }
  }, [navigate]);

  // Close mobile nav when route changes
  if (prevPathRef.current !== pathname) {
    prevPathRef.current = pathname;
    setMobileNavOpen(false);
  }

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate({ to: "/" });
  };

  const navItems = [
    { to: "/admin", label: "图片管理", icon: Images },
    { to: "/admin/watermark", label: "水印设置", icon: Stamp },
    { to: "/admin/payment", label: "支付设置", icon: CreditCard },
    { to: "/admin/contact", label: "联系发图", icon: MessageCircle },
  ];

  const currentPage = navItems.find((item) => item.to === pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navigation bar - mobile-first */}
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <Grid2x2 className="h-5 w-5 text-sidebar-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-display font-semibold text-sm text-sidebar-primary">
                小面包AI图库
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                管理后台
              </span>
            </div>
          </div>

          {/* Right side: back to gallery + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Back to gallery button */}
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
              title="返回浏览界面"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">返回浏览</span>
            </Link>

            {/* Hamburger menu button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label="切换菜单"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="text-sm">{currentPage?.label || "菜单"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  mobileNavOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dropdown nav menu */}
        {mobileNavOpen && (
          <nav
            className="border-t border-sidebar-border bg-sidebar"
            data-ocid="admin.nav.panel"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm border-b border-sidebar-border/50 transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  data-ocid="admin.nav.link"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto text-xs opacity-70">
                      ✓ 当前页面
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Logout */}
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-3.5 text-sm w-full text-left text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
              data-ocid="admin.nav.button"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </nav>
        )}
      </header>

      {/* Main content - full width, no sidebar */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
