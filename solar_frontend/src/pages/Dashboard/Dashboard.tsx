
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

import api from "../../api/axios_local";

import { getSites } from "../../api/sites";
import { getGenerationRecords } from "../../api/generation";

import {
  getMaintenanceSchedules,
  getBreakdowns,
} from "../../api/maintenance";


/* ==========================================================
   TYPES
========================================================== */

interface SiteFinancial {
  site_id: number;
  site_name: string;
  project_investment: string | number;
  historical_bill_value?: string | number;
  monthly_bill_value?: string | number;
  cumulative_bill_value: string | number;
  investment_percentage: number | null;
}

interface FinancialSummary {
  total_sites: number;
  total_investment: string | number;
  total_historical_bill?: string | number;
  total_monthly_bill?: string | number;
  total_cumulative_bill: string | number;
  overall_percentage: number | null;
  sites: SiteFinancial[];
}


/* ==========================================================
   HELPERS
========================================================== */

const formatMoney = (
  value: string | number | null | undefined
): string => {
  const amount = Number(value ?? 0);

  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


const formatNumber = (
  value: number
): string => {
  return value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


/* ==========================================================
   DASHBOARD COMPONENT
========================================================== */

export default function Dashboard() {

  /* ========================================================
     EXISTING DASHBOARD STATES
  ======================================================== */

  const [totalSites, setTotalSites] =
    useState<number | null>(null);

  const [todayGeneration, setTodayGeneration] =
    useState<number | null>(null);

  const [maintenanceTasks, setMaintenanceTasks] =
    useState<number | null>(null);

  const [openBreakdowns, setOpenBreakdowns] =
    useState<number | null>(null);


  /* ========================================================
     ERROR STATES
  ======================================================== */

  const [sitesError, setSitesError] = useState(false);

  const [generationError, setGenerationError] =
    useState(false);

  const [maintenanceError, setMaintenanceError] =
    useState(false);

  const [breakdownsError, setBreakdownsError] =
    useState(false);


  /* ========================================================
     FINANCIAL STATES
  ======================================================== */

  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);

  const [financialLoading, setFinancialLoading] =
    useState(true);

  const [financialError, setFinancialError] =
    useState(false);


  /* ========================================================
     LOAD DASHBOARD DATA
  ======================================================== */

  useEffect(() => {

    const loadDashboardData = async () => {

      /* -----------------------------------------------
         1. TOTAL REGISTERED SITES
      ----------------------------------------------- */

      try {

        const sites = await getSites();

        setTotalSites(sites.length);

      } catch (error) {

        console.error(
          "Failed to load dashboard sites:",
          error
        );

        setSitesError(true);
      }


      /* -----------------------------------------------
         2. TODAY'S GENERATION
      ----------------------------------------------- */

      try {

        const records = await getGenerationRecords();

        const now = new Date();

        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-");

        const total = records

          .filter(
            (record) =>
              record.generation_date.slice(0, 10) === today
          )

          .reduce(
            (sum, record) =>
              sum + (Number(record.generation_kwh) || 0),
            0
          );

        setTodayGeneration(total);

      } catch (error) {

        console.error(
          "Failed to load today's generation:",
          error
        );

        setGenerationError(true);
      }


      /* -----------------------------------------------
         3. MAINTENANCE TASKS
      ----------------------------------------------- */

      try {

        const schedules = await getMaintenanceSchedules();

        const activeTasks = schedules.filter(
          (item) =>
            item.status === "SCHEDULED" ||
            item.status === "IN_PROGRESS"
        );

        setMaintenanceTasks(activeTasks.length);

      } catch (error) {

        console.error(
          "Failed to load maintenance tasks:",
          error
        );

        setMaintenanceError(true);
      }


      /* -----------------------------------------------
         4. OPEN BREAKDOWNS
      ----------------------------------------------- */

      try {

        const breakdowns = await getBreakdowns();

        const activeBreakdowns = breakdowns.filter(
          (item) =>
            item.status === "OPEN" ||
            item.status === "INVESTIGATING" ||
            item.status === "IN_PROGRESS"
        );

        setOpenBreakdowns(activeBreakdowns.length);

      } catch (error) {

        console.error(
          "Failed to load breakdowns:",
          error
        );

        setBreakdownsError(true);
      }


      /* -----------------------------------------------
         5. SITE-WISE FINANCIAL SUMMARY
      ----------------------------------------------- */

      try {

        setFinancialLoading(true);
        setFinancialError(false);

        const response = await api.get(
          "/monthly-solar-records/site-financial-summary/"
        );

        setFinancialSummary(response.data);

      } catch (error) {

        console.error(
          "Failed to load financial summary:",
          error
        );

        setFinancialError(true);

      } finally {

        setFinancialLoading(false);
      }

    };

    void loadDashboardData();

  }, []);


  /* ========================================================
     OPERATIONAL DASHBOARD CARDS
  ======================================================== */

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
          : `${formatNumber(todayGeneration)} kWh`,

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


  /* ========================================================
     FINANCIAL SUMMARY VALUES
  ======================================================== */

  const totalInvestment = Number(
    financialSummary?.total_investment ?? 0
  );

  const totalHistoricalBill = Number(
    financialSummary?.total_historical_bill ?? 0
  );

  const totalMonthlyBill = Number(
    financialSummary?.total_monthly_bill ?? 0
  );

  const totalBillValue = Number(
    financialSummary?.total_cumulative_bill ?? 0
  );

  const overallPercentage =
    financialSummary?.overall_percentage ?? 0;


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: "100%",
      }}
    >

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >

        <DashboardOutlinedIcon
          sx={{
            fontSize: 40,
            color: "primary.main",
          }}
        />

        <Box>

          <Typography
            variant="h4"
            sx={{ fontWeight: 700 }}
          >
            SolarHub Dashboard
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
          >
            Solar plant operations and financial overview
          </Typography>

        </Box>

      </Box>


      {/* ==================================================
          OPERATIONAL KPI CARDS
      ================================================== */}

      <Grid container spacing={2}>

        {dashboardCards.map((card) => (

          <Grid
            key={card.title}
            size={{ xs: 12, sm: 6, lg: 3 }}
          >

            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: 2,
              }}
            >

              <CardContent>

                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mt: 1,
                    mb: 1,
                    fontWeight: 700,
                  }}
                >
                  {card.value}
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="caption"
                >
                  {card.description}
                </Typography>

              </CardContent>

            </Card>

          </Grid>

        ))}

      </Grid>


      {/* ==================================================
          FINANCIAL PERFORMANCE HEADER
      ================================================== */}

      <Box sx={{ mt: 5, mb: 2 }}>

        <Typography
          variant="h5"
          sx={{ fontWeight: 700 }}
        >
          Financial Performance
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Cumulative electricity bill value compared with
          total solar project investment.
        </Typography>

      </Box>


      {/* ==================================================
          FINANCIAL LOADING / ERROR
      ================================================== */}

      {financialLoading ? (

        <Card
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
          }}
        >

          <Typography color="text.secondary">
            Loading financial information...
          </Typography>

          <LinearProgress sx={{ mt: 2 }} />

        </Card>

      ) : financialError ? (

        <Alert severity="error">
          Unable to load site-wise financial information.
          Please check the financial summary API.
        </Alert>

      ) : financialSummary ? (

        <>

          {/* ==============================================
              OVERALL FINANCIAL SUMMARY
          ============================================== */}

          <Grid container spacing={2}>

            {/* TOTAL INVESTMENT */}

            <Grid size={{ xs: 12, md: 4 }}>

              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 2,
                }}
              >

                <CardContent>

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Total Project Investment
                    </Typography>

                    <AccountBalanceWalletOutlinedIcon
                      color="primary"
                    />

                  </Stack>

                  <Typography
                    variant="h5"
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                    }}
                  >
                    {formatMoney(totalInvestment)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Investment across all registered sites
                  </Typography>

                </CardContent>

              </Card>

            </Grid>


            {/* CUMULATIVE BILL VALUE */}

            <Grid size={{ xs: 12, md: 4 }}>

              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 2,
                }}
              >

                <CardContent>

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Cumulative Total Bill Value
                    </Typography>

                    <PaymentsOutlinedIcon
                      color="success"
                    />

                  </Stack>

                  <Typography
                    variant="h5"
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      color: "success.main",
                    }}
                  >
                    {formatMoney(totalBillValue)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Combined historical and SolarHub monthly bill values
                  </Typography>

                </CardContent>

              </Card>

            </Grid>


            {/* HISTORICAL BILL VALUE */}

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: "100%", borderRadius: 2 }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total Historical Bill Value
                    </Typography>
                    <PaymentsOutlinedIcon color="primary" />
                  </Stack>

                  <Typography
                    variant="h5"
                    sx={{ mt: 2, fontWeight: 700 }}
                  >
                    {formatMoney(totalHistoricalBill)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Annual historical values entered for all sites
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* SOLARHUB MONTHLY BILL VALUE */}

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: "100%", borderRadius: 2 }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total SolarHub Monthly Bill Value
                    </Typography>
                    <PaymentsOutlinedIcon color="success" />
                  </Stack>

                  <Typography
                    variant="h5"
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      color: "success.main",
                    }}
                  >
                    {formatMoney(totalMonthlyBill)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Total of monthly bills recorded in SolarHub
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* OVERALL PERCENTAGE */}

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>

              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 2,
                }}
              >

                <CardContent>

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Bill Value / Investment
                    </Typography>

                    <TrendingUpOutlinedIcon
                      color="success"
                    />

                  </Stack>

                  <Typography
                    variant="h4"
                    sx={{
                      mt: 1.5,
                      fontWeight: 700,
                      color: "success.main",
                    }}
                  >
                    {formatNumber(overallPercentage)}%
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      Math.max(overallPercentage, 0),
                      100
                    )}
                    color="success"
                    sx={{
                      mt: 2,
                      height: 9,
                      borderRadius: 5,
                    }}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Overall cumulative bill value relative
                    to investment
                  </Typography>

                </CardContent>

              </Card>

            </Grid>

          </Grid>


          {/* ==============================================
              SITE-WISE FINANCIAL PERFORMANCE
          ============================================== */}

          <Box sx={{ mt: 4, mb: 2 }}>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Site-wise Investment Performance
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Individual financial performance of each solar site.
            </Typography>

          </Box>


          {financialSummary.sites.length === 0 ? (

            <Alert severity="info">
              No solar sites are available.
            </Alert>

          ) : (

            <Grid container spacing={2}>

              {financialSummary.sites.map((site) => {

                const investment = Number(
                  site.project_investment || 0
                );

                const billValue = Number(
                  site.cumulative_bill_value || 0
                );

                const percentage =
                  site.investment_percentage;

                const validPercentage =
                  percentage !== null &&
                  Number.isFinite(percentage);

                const progress = validPercentage
                  ? Math.min(
                      Math.max(percentage, 0),
                      100
                    )
                  : 0;

                const progressColor =
                  validPercentage && percentage >= 100
                    ? "success"
                    : "primary";

                return (

                  <Grid
                    key={site.site_id}
                    size={{ xs: 12, md: 6, lg: 4 }}
                  >

                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: 2,
                        transition: "0.2s",

                        "&:hover": {
                          boxShadow: 3,
                          borderColor: "primary.main",
                        },
                      }}
                    >

                      <CardContent>

                        {/* SITE NAME */}

                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >

                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {site.site_name}
                          </Typography>

                          <Chip
                            size="small"
                            variant="outlined"
                            color={
                              validPercentage &&
                              percentage >= 100
                                ? "success"
                                : "default"
                            }
                            label={
                              validPercentage
                                ? `${formatNumber(percentage)}%`
                                : "N/A"
                            }
                          />

                        </Stack>


                        <Divider sx={{ my: 2 }} />


                        {/* PROJECT INVESTMENT */}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Project Investment
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700 }}
                        >
                          {formatMoney(investment)}
                        </Typography>


                        {/* HISTORICAL BILL VALUE */}

                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Historical Bill Value
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatMoney(site.historical_bill_value)}
                          </Typography>
                        </Box>

                        {/* SOLARHUB MONTHLY BILL VALUE */}

                        <Box sx={{ mt: 1.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            SolarHub Monthly Bill Value
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatMoney(site.monthly_bill_value)}
                          </Typography>
                        </Box>

                        {/* CUMULATIVE BILL VALUE */}

                        <Box sx={{ mt: 2 }}>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Cumulative Total Bill Value
                          </Typography>

                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "success.main",
                            }}
                          >
                            {formatMoney(billValue)}
                          </Typography>

                        </Box>


                        {/* INVESTMENT PROGRESS */}

                        <Box sx={{ mt: 2 }}>

                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Investment Comparison
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {validPercentage
                                ? `${formatNumber(percentage)}%`
                                : "N/A"}
                            </Typography>

                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={progressColor}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: "action.hover",
                            }}
                          />

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 1,
                            }}
                          >

                            {!validPercentage

                              ? "Investment is not available or is zero."

                              : percentage >= 100

                                ? "Cumulative bill value has reached or exceeded investment."

                                : `${formatNumber(
                                    100 - percentage
                                  )}% remaining to reach investment value.`}

                          </Typography>

                        </Box>

                      </CardContent>

                    </Card>

                  </Grid>

                );

              })}

            </Grid>

          )}

        </>

      ) : null}

    </Box>

  );

}
