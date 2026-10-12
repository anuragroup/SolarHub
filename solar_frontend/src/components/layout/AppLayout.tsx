
import React, { useState } from "react";
import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

import Dashboard from "../../pages/Dashboard/Dashboard";
import SiteMaster from "../../pages/Sites/SiteMaster";
import GenerationMeter from "../../pages/Generation/GenerationMeter";
import MaintenancePage from "../../pages/Maintenance/MaintenancePage";
import FaultsBreakdowns from "../../pages/Faults/FaultsBreakdowns";
import Reports from "../../pages/Reports/Reports";

interface AppLayoutProps {
  onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";
      case "sites":
        return "Site & Asset Master";
      case "generation":
        return "Generation & Meter";
      case "maintenance":
        return "Maintenance Management";
      case "faults":
        return "Faults & Breakdowns";
      case "reports":
        return "Reports";
      default:
        return "Dashboard";
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onLogout={onLogout} />;
      case "sites":
        return <SiteMaster />;
      case "generation":
        return <GenerationMeter />;
      case "maintenance":
        return <MaintenancePage />;
      case "faults":
        return <FaultsBreakdowns />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard onLogout={onLogout} />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "background.default",
      }}
    >
      <TopBar
        onMenuClick={() => setSidebarOpen(true)}
        pageTitle={getPageTitle()}
        username="User"
        onLogout={onLogout}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: "260px" },
          pt: { xs: "80px", md: "86px" },
          px: { xs: 1.5, sm: 2, md: 2.5 },
          pb: 4,
          width: {
            xs: "100%",
            md: "calc(100% - 260px)",
          },
          minHeight: "100vh",
          minWidth: 0,
          boxSizing: "border-box",
          overflowX: "auto",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "none",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          {renderActivePage()}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
