import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, Repeat, Mail, User, Home, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogRocket from "logrocket";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/useAuth";
import logo from "/src/assets/PenguinShift_Logo.png";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  { title: "Home", url: createPageUrl("LandingPage"), icon: Home },
  { title: "Shift", url: "/shift/select", icon: Repeat },
  { title: "Contact Us", url: createPageUrl("Contact"), icon: Mail },
  { title: "Profile", url: createPageUrl("Profile"), icon: User },
];

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  LogRocket.init("qjhgt3/penguinshift");
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth(); // ✅ global context

  if (currentPageName === "Auth") return <>{children}</>;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-gray-600">
        Loading...
      </div>
    );

  // ✅ Hide "Profile" if not logged in
  const filteredNavItems = user
    ? navigationItems
    : navigationItems.filter((item) => item.title !== "Profile");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Desktop Header */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to={createPageUrl("LandingPage")}
              className="flex items-center gap-3 group"
            >
              <img src={logo} alt="PenguinShift Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                PenguinShift
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-8">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 hover:bg-purple-50 hover:text-purple-700 ${
                    location.pathname === item.url
                      ? "text-purple-700 bg-purple-50"
                      : "text-gray-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}

              {/* ✅ Auth state-dependent buttons */}
              {user ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-700 hover:text-purple-700"
                    onClick={() => navigate("/profile")}
                  >
                    <UserCircle className="w-5 h-5" />
                    {user.name}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-red-600"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Link to="/auth?mode=register">
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <User className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link
            to={createPageUrl("LandingPage")}
            className="flex items-center gap-2"
          >
            <img
              src={logo}
              alt="PenguinShift Logo"
              className="w-8 h-8 rounded-lg shadow-md"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
              PenguinShift
            </span>
          </Link>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-purple-50"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white/95 backdrop-blur-xl">
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  PenguinShift
                </SheetTitle>
                <SheetDescription>
                  Transfer your playlists between platforms
                </SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col gap-4 mt-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      location.pathname === item.url
                        ? "text-purple-700 bg-purple-50"
                        : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </Link>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <>
                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center gap-2 text-gray-700 hover:text-purple-700"
                      >
                        <UserCircle className="w-5 h-5" />
                        {user.name}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-gray-500 hover:text-red-600 mt-2"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth?mode=register">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg">
                        <User className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer (only on LandingPage) */}
      {currentPageName === "LandingPage" && (
        <footer className="bg-slate-900 text-white py-16 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} PenguinShift — All rights reserved.
          </p>
        </footer>
      )}
    </div>
  );
}
