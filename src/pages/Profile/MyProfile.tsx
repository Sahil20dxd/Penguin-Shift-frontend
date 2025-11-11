// src/pages/Profile/MyProfile.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Repeat, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import ProfileTabs from "@/components/profile/ProfileTabs";
import MyHistory from "@/components/profile/MyHistory";
import MySharing from "@/components/profile/MySharing";
import AccountSettings from "@/components/profile/AccountSettings";
import ProfileQuote from "@/components/profile/ProfileQuote";
import { useAuth } from "@/context/useAuth";
import { Navigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MyProfile() {
  // inside component
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  const [activeTab, setActiveTab] = useState("history");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case "history":
        return "My History";
      case "sharing":
        return "My Sharing";
      case "settings":
        return "Account Settings";
      default:
        return "My History";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              My Profile
            </motion.h1>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-purple-50"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-white/95 backdrop-blur-xl"
              >
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="text-xl font-bold text-gray-900">
                    Profile Menu
                  </SheetTitle>
                </SheetHeader>
                <ProfileTabs
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  isMobile={true}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop New Shift Button */}
          <Link to={createPageUrl("Dashboard")} className="hidden md:block">
            <Button className="bg-black hover:bg-gray-800 text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-lg">
              <Repeat className="w-5 h-5 mr-2" />
              New Shift
            </Button>
          </Link>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden md:block">
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Mobile Current Tab Title */}
        <div className="md:hidden mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {getTabTitle()}
          </h2>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-16"
        >
          {activeTab === "history" && <MyHistory />}
          {activeTab === "sharing" && <MySharing />}
          {activeTab === "settings" && <AccountSettings />}
        </motion.div>

        {/* Inspirational Quote Section */}
        <ProfileQuote />
      </div>
    </div>
  );
}
