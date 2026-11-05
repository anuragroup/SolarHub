
import React, { useState } from "react";

import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

import ElectricMeterOutlinedIcon from "@mui/icons-material/ElectricMeterOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* ============================================================
   PROPS
============================================================ */

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

/* ============================================================
   MENU ITEM TYPE
============================================================ */

interface MenuItem {
  label: string;
  key: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

/* ============================================================
   MENU ITEMS
============================================================ */

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    key: "dashboard",
    icon: <DashboardOutlinedIcon />,
  },

  {
    label: "Site & Asset Master",
    key: "sites",
    icon: <SolarPowerOutlinedIcon />,
    children: [],
  },

  // ==========================================================
  // GENERATION & METER
  // ==========================================================

  {
    label: "Generation & Meter",
    key: "generation-menu",
    icon: <BoltOutlinedIcon />,

    children: [
      {
        label: "Daily Generation & Meter",
        key: "generation",
        icon: <ElectricMeterOutlinedIcon />,
      },

      {
        label: "Monthly Solar Entry",
        key: "monthly-solar-entry",
        icon: <CalendarMonthOutlinedIcon />,
      },
    ],
  },

  {
    label: "Maintenance",
    key: "maintenance",
    icon: <BuildOutlinedIcon />,
  },

  {
    label: "Faults & Breakdowns",
    key: "faults",
    icon: <ReportProblemOutlinedIcon />,
    children: [],
  },

  {
    label: "Reports",
    key: "reports",
    icon: <AssessmentOutlinedIcon />,
    children: [],
  },
];

/* ============================================================
   CONSTANTS
============================================================ */

const drawerWidth = 260;
const topBarHeight = 70;

const SIDEBAR_BG = "#101A2E";
const SIDEBAR_SURFACE = "#19263B";
const SIDEBAR_BORDER = "#34445C";

const ICON_ORANGE = "#FF9D00";
const ACCENT_GREEN = "#00D6A0";

const TEXT_WHITE = "#FFFFFF";
const TEXT_MUTED = "#B6C2D2";

/* ============================================================
   SIDEBAR COMPONENT
============================================================ */

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  activePage,
  onNavigate,
}) => {
  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  const [expandedItems, setExpandedItems] = useState<
    Record<string, boolean>
  >({});

  /* ==========================================================
     PARENT MENU CLICK
  ========================================================== */

  const handleParentClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      setExpandedItems((previous) => ({
        ...previous,
        [item.key]: !previous[item.key],
      }));

      return;
    }

    onNavigate(item.key);

    if (isMobile) {
      onClose();
    }
  };

  /* ==========================================================
     CHILD MENU CLICK
  ========================================================== */

  const handleChildClick = (child: MenuItem) => {
    onNavigate(child.key);

    if (isMobile) {
      onClose();
    }
  };

  /* ==========================================================
     RENDER MENU ITEMS
  ========================================================== */

  const renderMenuItems = (
    items: MenuItem[],
    level = 0
  ): React.ReactNode => {
    return items.map((item) => {
      const hasChildren =
        !!item.children && item.children.length > 0;

      const isExpanded =
        expandedItems[item.key] === true;

      const isActive =
        activePage === item.key ||
        (item.children?.some(
          (child) => child.key === activePage
        ) ?? false);

      return (
        <React.Fragment key={item.key}>

          {/* ==================================================
              PARENT MENU
          ================================================== */}

          <ListItemButton
            onClick={() => handleParentClick(item)}
            selected={
              !hasChildren && activePage === item.key
            }
            sx={{
              position: "relative",
              borderRadius: "9px",
              mb: 0.75,
              minHeight: 48,
              pl: 1.5 + level * 2,
              color: TEXT_WHITE,
              transition: "background-color 160ms ease",

              "&.Mui-selected": {
                backgroundColor: SIDEBAR_SURFACE,
                color: TEXT_WHITE,

                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 4,
                  borderRadius: "0 4px 4px 0",
                  backgroundColor: ACCENT_GREEN,
                },

                "& .MuiListItemIcon-root": {
                  color: ICON_ORANGE,
                },

                "& .MuiListItemText-primary": {
                  color: TEXT_WHITE,
                  fontWeight: 600,
                },
              },

              "&.Mui-selected:hover": {
                backgroundColor: "#23334A",
              },

              "&:hover": {
                backgroundColor: "#19263B",
              },
            }}
          >

            <ListItemIcon
              sx={{
                minWidth: 42,
                color: ICON_ORANGE,

                "& .MuiSvgIcon-root": {
                  fontSize: 23,
                },
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: TEXT_WHITE,
                  },
                },
              }}
            />

            {hasChildren &&
              (isExpanded ? (
                <ExpandLessIcon
                  sx={{
                    fontSize: 20,
                    color: ACCENT_GREEN,
                  }}
                />
              ) : (
                <ExpandMoreIcon
                  sx={{
                    fontSize: 20,
                    color: TEXT_MUTED,
                  }}
                />
              ))}

          </ListItemButton>

          {/* ==================================================
              CHILD MENU
          ================================================== */}

          {hasChildren && (
            <Collapse
              in={isExpanded}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>

                {item.children?.map((child) => (

                  <ListItemButton
                    key={child.key}
                    selected={activePage === child.key}
                    onClick={() => handleChildClick(child)}
                    sx={{
                      position: "relative",
                      borderRadius: "8px",
                      mb: 0.5,
                      minHeight: 42,
                      pl: 5,
                      color: TEXT_WHITE,

                      "&.Mui-selected": {
                        backgroundColor: SIDEBAR_SURFACE,
                        color: TEXT_WHITE,

                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 7,
                          bottom: 7,
                          width: 3,
                          borderRadius: "0 4px 4px 0",
                          backgroundColor: ACCENT_GREEN,
                        },

                        "& .MuiListItemIcon-root": {
                          color: ICON_ORANGE,
                        },

                        "& .MuiListItemText-primary": {
                          color: TEXT_WHITE,
                          fontWeight: 600,
                        },
                      },

                      "&.Mui-selected:hover": {
                        backgroundColor: "#23334A",
                      },

                      "&:hover": {
                        backgroundColor: "#19263B",
                      },
                    }}
                  >

                    <ListItemIcon
                      sx={{
                        minWidth: 34,
                        color: ICON_ORANGE,

                        "& .MuiSvgIcon-root": {
                          fontSize: 20,
                        },
                      }}
                    >
                      {child.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={child.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: 13,
                            fontWeight:
                              activePage === child.key
                                ? 600
                                : 400,
                            color: TEXT_WHITE,
                          },
                        },
                      }}
                    />

                  </ListItemButton>

                ))}

              </List>
            </Collapse>
          )}

        </React.Fragment>
      );
    });
  };

  /* ==========================================================
     DRAWER CONTENT
  ========================================================== */

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: SIDEBAR_BG,
        color: TEXT_WHITE,
      }}
    >

      {/* MENU */}

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 1.5,
          WebkitOverflowScrolling: "touch",

          "&::-webkit-scrollbar": {
            width: 6,
          },

          "&::-webkit-scrollbar-thumb": {
            backgroundColor: SIDEBAR_BORDER,
            borderRadius: 3,
          },

          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >

        <List sx={{ px: 1.5, py: 0 }}>
          {renderMenuItems(menuItems)}
        </List>

      </Box>

      {/* SIDEBAR FOOTER */}

      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          borderTop: `1px solid ${SIDEBAR_BORDER}`,
        }}
      >

        <Typography
          sx={{
            fontSize: 10,
            letterSpacing: "0.8px",
            color: TEXT_MUTED,
          }}
        >
          POWERING SOLAR OPERATIONS
        </Typography>

        <Typography
          sx={{
            fontSize: 11,
            mt: 0.5,
            color: ACCENT_GREEN,
            fontWeight: 600,
          }}
        >
          Efficient · Reliable · Sustainable
        </Typography>

      </Box>

    </Box>
  );

  /* ==========================================================
     DRAWER
  ========================================================== */

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,

        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",

          top: {
            xs: 0,
            md: `${topBarHeight}px`,
          },

          height: {
            xs: "100vh",
            md: `calc(100vh - ${topBarHeight}px)`,
          },

          borderRight: `1px solid ${SIDEBAR_BORDER}`,
          backgroundColor: SIDEBAR_BG,
          color: TEXT_WHITE,
          overflow: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
