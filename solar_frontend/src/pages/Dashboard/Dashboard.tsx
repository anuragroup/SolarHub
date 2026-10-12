
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import { getSites } from "../../api/sites";
import { getGenerationRecords } from "../../api/generation";
import {
  getMaintenanceSchedules,
  getBreakdowns,
} from "../../api/maintenance";

export default function Dashboard() {
  const [totalSites, setTotalSites] = useState<number | null>(null);
  const [todayGeneration, setTodayGeneration] = useState<number | null>(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState<number | null>(null);
  const [openBreakdowns, setOpenBreakdowns] = useState<number | null>(null);

  const [sitesError, setSitesError] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState(false);
  const [breakdownsError, setBreakdownsError] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      // 1. Total registered solar sites
      try {
        const sites = await getSites();
        setTotalSites(sites.length);
      } catch (error) {
        console.error("Failed to load dashboard sites:", error);
        setSitesError(true);
      }

      // 2. Today's total generation
      try {
        const records = await getGenerationRecords();

        const now = new Date();
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-");

        const total = records
          .filter((record) => record.generation_date.slice(0, 10) === today)
          .reduce(
            (sum, record) => sum + (Number(record.generation_kwh) || 0),
            0,
          );

        setTodayGeneration(total);
      } catch (error) {
        console.error("Failed to load today's generation:", error);
        setGenerationError(true);
      }

      // 3. Maintenance tasks not yet completed or cancelled
      try {
        const schedules = await getMaintenanceSchedules();

        const activeTasks = schedules.filter(
          (item) =>
            item.status === "SCHEDULED" ||
            item.status === "IN_PROGRESS",
        );

        setMaintenanceTasks(activeTasks.length);
      } catch (error) {
        console.error("Failed to load maintenance tasks:", error);
        setMaintenanceError(true);
      }

      // 4. Breakdowns not yet resolved or closed
      try {
        const breakdowns = await getBreakdowns();

        const activeBreakdowns = breakdowns.filter(
          (item) =>
            item.status === "OPEN" ||
            item.status === "INVESTIGATING" ||
            item.status === "IN_PROGRESS",
        );

        setOpenBreakdowns(activeBreakdowns.length);
      } catch (error) {
        console.error("Failed to load breakdowns:", error);
        setBreakdownsError(true);
      }
    };

    void loadDashboardData();
  }, []);

  const dashboardCards = [
    {
      title: "Total Solar Sites",
      value: sitesError
        ? "Unavailable"
        : totalSites === null
          ? "Loading..."
          : String(totalSites),
      description: sitesError
        ? "Could not load sites"
        : "Registered solar sites",
    },
    {
      title: "Today's Generation",
      value: generationError
        ? "Unavailable"
        : todayGeneration === null
          ? "Loading..."
          : `${todayGeneration.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} kWh`,
      description: generationError
        ? "Could not load generation records"
        : "Total recorded generation today",
    },
    {
      title: "Maintenance Tasks",
      value: maintenanceError
        ? "Unavailable"
        : maintenanceTasks === null
          ? "Loading..."
          : String(maintenanceTasks),
      description: maintenanceError
        ? "Could not load maintenance schedules"
        : "Scheduled or in progress",
    },
    {
      title: "Open Breakdowns",
      value: breakdownsError
        ? "Unavailable"
        : openBreakdowns === null
          ? "Loading..."
          : String(openBreakdowns),
      description: breakdownsError
        ? "Could not load breakdown records"
        : "Open, investigating or in progress",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <DashboardOutlinedIcon
          sx={{ fontSize: 40, color: "primary.main" }}
        />

        <Box>
          <Typography variant="h4" fontWeight={700}>
            SolarHub Dashboard
          </Typography>

          <Typography color="text.secondary">
            Solar plant operations overview
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {dashboardCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {card.title}
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ mt: 1, mb: 1 }}
                >
                  {card.value}
                </Typography>

                <Typography color="text.secondary" variant="caption">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
