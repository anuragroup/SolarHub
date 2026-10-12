
import React from "react";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";

interface TopBarProps {
  onMenuClick: () => void;
  pageTitle: string;
  username?: string;
  onLogout: () => void;
}

const NAVY = "#101A2E";
const NAVY_HOVER = "#19263B";
const ORANGE = "#FF9D00";
const GREEN = "#00D6A0";
const WHITE = "#FFFFFF";
const MUTED = "#B6C2D2";

const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  pageTitle,
  username = "User",
  onLogout,
}) => {
  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: NAVY,
        color: WHITE,
        borderBottom: "1px solid #26364D",
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: {
            xs: 64,
            md: 70,
          },
          px: {
            xs: 1.5,
            sm: 2.5,
            md: 3,
          },
          gap: 1,
        }}
      >
        {/* Mobile navigation */}
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            sx={{
              color: ORANGE,
              mr: 0.5,
              "&:hover": {
                backgroundColor: NAVY_HOVER,
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* SolarHub branding */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            minWidth: {
              xs: "auto",
              md: 220,
            },
          }}
        >
          <WbSunnyOutlinedIcon
            sx={{
              fontSize: {
                xs: 25,
                md: 28,
              },
              color: ORANGE,
            }}
          />

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: WHITE,
              letterSpacing: "-0.4px",
              fontSize: {
                xs: "1.1rem",
                sm: "1.3rem",
              },
              whiteSpace: "nowrap",
            }}
          >
            Solar<Typography
              component="span"
              sx={{
                color: GREEN,
                fontWeight: 700,
                fontSize: "inherit",
              }}
            >Hub</Typography>
          </Typography>
        </Box>

        {/* Current page */}
        <Typography
          variant="body1"
          sx={{
            ml: {
              xs: 0.5,
              md: 2,
            },
            color: MUTED,
            fontWeight: 500,
            display: {
              xs: "none",
              sm: "block",
            },
            whiteSpace: "nowrap",
          }}
        >
          {pageTitle}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Online indicator on desktop */}
        {!isMobile && (
          <Chip
            label="ONLINE"
            size="small"
            sx={{
              mr: 2,
              color: GREEN,
              backgroundColor: "rgba(0, 214, 160, 0.12)",
              border: "1px solid rgba(0, 214, 160, 0.2)",
              fontWeight: 600,
              letterSpacing: "0.5px",
              height: 27,
            }}
          />
        )}

        {/* User */}
        <Typography
          variant="body2"
          sx={{
            mr: {
              xs: 0.5,
              sm: 1,
            },
            color: WHITE,
            display: {
              xs: "none",
              sm: "block",
            },
          }}
        >
          {username}
        </Typography>

        {/* Logout */}
        <Button
          onClick={onLogout}
          startIcon={<LogoutOutlinedIcon />}
          aria-label="Logout"
          sx={{
            color: WHITE,
            minWidth: {
              xs: 40,
              sm: "auto",
            },
            px: {
              xs: 1,
              sm: 1.5,
            },
            "& .MuiButton-startIcon": {
              color: ORANGE,
            },
            "&:hover": {
              backgroundColor: NAVY_HOVER,
            },
          }}
        >
          <Box
            component="span"
            sx={{
              display: {
                xs: "none",
                sm: "inline",
              },
            }}
          >
            Logout
          </Box>
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
