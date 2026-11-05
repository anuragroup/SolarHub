
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import {
  getGenerationRecords,
  type GenerationRecord,
} from "../../api/generation";

import {
  getMaintenanceSchedules,
  getBreakdowns,
  type MaintenanceSchedule,
  type Breakdown,
} from "../../api/maintenance";

// --------------------------------------------------
// REPORT CATEGORIES
// --------------------------------------------------

const reportCategories = [
  { value: "generation", label: "Generation Report" },
  { value: "maintenance", label: "Maintenance Report" },
  { value: "faults", label: "Faults & Breakdowns Report" },
  { value: "site-performance", label: "Site Performance Summary" },
];

// --------------------------------------------------
// TABLE STYLES
// --------------------------------------------------

const tableStyles = {
  width: "100%",
  borderCollapse: "collapse" as const,

  "& th, & td": {
    p: 1.5,
    textAlign: "left" as const,
    borderBottom: 1,
    borderColor: "divider",
    whiteSpace: "nowrap",
  },

  "& th": {
    fontWeight: 700,
    bgcolor: "action.hover",
  },
};

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type SiteSummary = {
  site: number;
  name: string;
  count: number;
  actual: number;
  expected: number;
  performanceActual: number;
};

// --------------------------------------------------
// DATE HELPER
// --------------------------------------------------

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function Reports() {
  const today = getLocalDate();
  const firstDay = `${today.slice(0, 7)}-01`;

  // Filters
  const [category, setCategory] = useState("generation");
  const [siteId, setSiteId] = useState("all");

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);

  const [selectedMonth, setSelectedMonth] = useState(
    today.slice(0, 7)
  );

  // Site choices
  const [siteOptions, setSiteOptions] = useState<
    { id: number; name: string }[]
  >([]);

  // Report records
  const [generationRecords, setGenerationRecords] = useState<
    GenerationRecord[]
  >([]);

  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceSchedule[]
  >([]);

  const [breakdownRecords, setBreakdownRecords] = useState<
    Breakdown[]
  >([]);

  // UI states
  const [reportRequested, setReportRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // NUMBER FORMAT
  // --------------------------------------------------

  const formatNumber = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  // --------------------------------------------------
  // UPDATE SITE OPTIONS
  // --------------------------------------------------

  const updateSiteOptions = (
    records: {
      site: number;
      site_name: string;
    }[]
  ) => {
    setSiteOptions((previous) => {
      const sites = new Map<number, string>();

      previous.forEach((site) => {
        sites.set(site.id, site.name);
      });

      records.forEach((record) => {
        sites.set(record.site, record.site_name);
      });

      return Array.from(sites.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  // Load site choices when page opens.
  useEffect(() => {
    let active = true;

    const loadSites = async () => {
      try {
        const records = await getGenerationRecords();

        if (!active) return;

        updateSiteOptions(records);
      } catch (err) {
        console.error("Unable to load solar sites:", err);
      }
    };

    loadSites();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // GENERATE REPORT
  // --------------------------------------------------

  const handleGenerateReport = async () => {
    // Validate dates for non-monthly reports.
    if (category !== "site-performance") {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates.");
        setReportRequested(false);
        return;
      }

      if (startDate > endDate) {
        setError("Start date cannot be after end date.");
        setReportRequested(false);
        return;
      }
    }

    // Validate monthly selection.
    if (category === "site-performance" && !selectedMonth) {
      setError("Please select a month.");
      setReportRequested(false);
      return;
    }

    setLoading(true);
    setError("");
    setReportRequested(false);

    try {
      // ----------------------------------------------
      // GENERATION AND SITE PERFORMANCE
      // ----------------------------------------------

      if (
        category === "generation" ||
        category === "site-performance"
      ) {
        const records = await getGenerationRecords();

        updateSiteOptions(records);

        const filtered = records.filter((record) => {
          const matchesSite =
            siteId === "all" ||
            String(record.site) === siteId;

          const recordDate = String(record.generation_date);

          const matchesDate =
            category === "site-performance"
              ? recordDate.slice(0, 7) === selectedMonth
              : recordDate >= startDate &&
                recordDate <= endDate;

          return matchesSite && matchesDate;
        });

        setGenerationRecords(filtered);
      }

      // ----------------------------------------------
      // MAINTENANCE REPORT
      // ----------------------------------------------

      else if (category === "maintenance") {
        const records = await getMaintenanceSchedules();

        updateSiteOptions(records);

        const filtered = records.filter((record) => {
          const matchesSite =
            siteId === "all" ||
            String(record.site) === siteId;

          return (
            matchesSite &&
            record.scheduled_date >= startDate &&
            record.scheduled_date <= endDate
          );
        });

        setMaintenanceRecords(filtered);
      }

      // ----------------------------------------------
      // FAULTS AND BREAKDOWNS REPORT
      // ----------------------------------------------

      else if (category === "faults") {
        const records = await getBreakdowns();

        updateSiteOptions(records);

        const filtered = records.filter((record) => {
          const matchesSite =
            siteId === "all" ||
            String(record.site) === siteId;

          return (
            matchesSite &&
            record.breakdown_date >= startDate &&
            record.breakdown_date <= endDate
          );
        });

        setBreakdownRecords(filtered);
      }

      setReportRequested(true);

    } catch (err) {
      console.error("Failed to load report:", err);

      setError(
        "Unable to load report data. Check that Django is running, the API endpoint is available, and you are logged in."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // GENERATION REPORT CALCULATIONS
  // --------------------------------------------------

  const totalGeneration = generationRecords.reduce(
    (total, record) =>
      total + Number(record.generation_kwh || 0),
    0
  );

  const totalExpected = generationRecords.reduce(
    (total, record) =>
      total + Number(record.expected_generation_kwh || 0),
    0
  );

  const recordsWithExpected = generationRecords.filter(
    (record) =>
      record.expected_generation_kwh !== null &&
      Number(record.expected_generation_kwh) > 0
  );

  const actualForPerformance = recordsWithExpected.reduce(
    (total, record) =>
      total + Number(record.generation_kwh || 0),
    0
  );

  const expectedForPerformance = recordsWithExpected.reduce(
    (total, record) =>
      total + Number(record.expected_generation_kwh || 0),
    0
  );

  const overallPerformance =
    expectedForPerformance > 0
      ? (actualForPerformance / expectedForPerformance) * 100
      : null;

  // --------------------------------------------------
  // MAINTENANCE STATUS COUNTS
  // --------------------------------------------------

  const maintenanceStatusCounts = maintenanceRecords.reduce<
    Record<string, number>
  >((counts, record) => {
    counts[record.status] =
      (counts[record.status] || 0) + 1;

    return counts;
  }, {});

  // --------------------------------------------------
  // BREAKDOWN STATUS COUNTS
  // --------------------------------------------------

  const breakdownStatusCounts = breakdownRecords.reduce<
    Record<string, number>
  >((counts, record) => {
    counts[record.status] =
      (counts[record.status] || 0) + 1;

    return counts;
  }, {});

  // --------------------------------------------------
  // MONTHLY SITE PERFORMANCE
  // --------------------------------------------------

  const siteSummaries = Array.from(
    generationRecords.reduce((groups, record) => {
      const current: SiteSummary =
        groups.get(record.site) ?? {
          site: record.site,
          name: record.site_name,
          count: 0,
          actual: 0,
          expected: 0,
          performanceActual: 0,
        };

      const actual = Number(record.generation_kwh || 0);

      current.count += 1;
      current.actual += actual;

      if (
        record.expected_generation_kwh !== null &&
        Number(record.expected_generation_kwh) > 0
      ) {
        current.expected += Number(
          record.expected_generation_kwh
        );

        current.performanceActual += actual;
      }

      groups.set(record.site, current);

      return groups;
    }, new Map<number, SiteSummary>()).values()
  );

  // --------------------------------------------------
  // MONTHLY CONSOLIDATED TOTALS
  // --------------------------------------------------

  const monthlyActual = siteSummaries.reduce(
    (total, site) => total + site.actual,
    0
  );

  const monthlyExpected = siteSummaries.reduce(
    (total, site) => total + site.expected,
    0
  );

  const monthlyPerformanceActual = siteSummaries.reduce(
    (total, site) =>
      total + site.performanceActual,
    0
  );

  const monthlyPerformance =
    monthlyExpected > 0
      ? (monthlyPerformanceActual / monthlyExpected) * 100
      : null;

  const monthlyRecordCount = siteSummaries.reduce(
    (total, site) => total + site.count,
    0
  );

  const selectedMonthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString(
        undefined,
        { month: "long", year: "numeric" }
      )
    : "";

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* PAGE HEADER */}

      <Stack
  direction="row"
  sx={{
    mt: 2,
    justifyContent: "flex-end",
  }}
>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Reports
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Review generation, maintenance, faults, and site performance.
          </Typography>
        </Box>

        <AssessmentOutlinedIcon
          sx={{ fontSize: 42, color: "primary.main" }}
        />
      </Stack>

      {/* REPORT FILTERS */}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600}}>
            Report Filters
          </Typography>

          <Grid container spacing={2}>

            {/* CATEGORY */}

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Report Category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setReportRequested(false);
                  setError("");
                }}
              >
                {reportCategories.map((item) => (
                  <MenuItem
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* SOLAR SITE */}

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Solar Site"
                value={siteId}
                onChange={(event) => {
                  setSiteId(event.target.value);
                  setReportRequested(false);
                  setError("");
                }}
              >
                <MenuItem value="all">
                  All Sites
                </MenuItem>

                {siteOptions.map((site) => (
                  <MenuItem
                    key={site.id}
                    value={String(site.id)}
                  >
                    {site.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* MONTH SELECTOR FOR SITE PERFORMANCE */}

            {category === "site-performance" ? (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="month"
                  label="Select Month"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value);
                    setReportRequested(false);
                    setError("");
                  }}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              </Grid>
            ) : (
              <>
                {/* START DATE */}

                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      setReportRequested(false);
                      setError("");
                    }}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>

                {/* END DATE */}

                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      setReportRequested(false);
                      setError("");
                    }}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* GENERATE BUTTON */}

          <Stack
  direction="row"
  sx={{
    mt: 2,
    justifyContent: "flex-end",
  }}
>
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <PlayArrowIcon />
                )
              }
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? "Loading..." : "Generate Report"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ERROR MESSAGE */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600}}>
        Report Results
      </Typography>

      {/* INITIAL STATE */}

      {!reportRequested && !error && (
        <Card variant="outlined">
          <CardContent sx={{ py: 5, textAlign: "center" }}>
            <AssessmentOutlinedIcon
              sx={{
                fontSize: 48,
                color: "text.secondary",
                mb: 1,
              }}
            />

            <Typography variant="h6">
              No Report Generated
            </Typography>

            <Typography color="text.secondary">
              Select your filters and click Generate Report to begin.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ==============================================
          GENERATION REPORT
      ============================================== */}

      {reportRequested && category === "generation" && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">
                    Total Generation
                  </Typography>

                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatNumber(totalGeneration)} kWh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">
                    Expected Generation
                  </Typography>

                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatNumber(totalExpected)} kWh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">
                    Overall Performance
                  </Typography>

                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {overallPerformance === null
                      ? "N/A"
                      : `${formatNumber(overallPerformance)}%`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generation Records
              </Typography>

              <Typography color="text.secondary" sx={{ my: 2 }}>
                {startDate} to {endDate} · {generationRecords.length} record(s)
              </Typography>

              {generationRecords.length === 0 ? (
                <Alert severity="info">
                  No generation records found for these filters.
                </Alert>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Box component="table" sx={tableStyles}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Site</th>
                        <th>Actual (kWh)</th>
                        <th>Expected (kWh)</th>
                        <th>Performance</th>
                        <th>Peak Power (kW)</th>
                      </tr>
                    </thead>

                    <tbody>
                      {generationRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.generation_date}</td>
                          <td>{record.site_name}</td>

                          <td>
                            {formatNumber(
                              Number(record.generation_kwh || 0)
                            )}
                          </td>

                          <td>
                            {record.expected_generation_kwh === null
                              ? "N/A"
                              : formatNumber(
                                  Number(record.expected_generation_kwh)
                                )}
                          </td>

                          <td>
                            {record.performance_percentage === null
                              ? "N/A"
                              : `${formatNumber(
                                  record.performance_percentage
                                )}%`}
                          </td>

                          <td>
                            {record.peak_power_kw === null
                              ? "N/A"
                              : formatNumber(
                                  Number(record.peak_power_kw)
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ==============================================
          MAINTENANCE REPORT
      ============================================== */}

      {reportRequested && category === "maintenance" && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Maintenance Report
            </Typography>

            <Typography color="text.secondary" sx={{ my: 2 }}>
              {startDate} to {endDate} · {maintenanceRecords.length} task(s)
            </Typography>

            <Stack
              direction="row"
              spacing={1}
             
              useFlexGap
              sx={{ mb: 2, flexWrap: 'wrap'}}
            >
              {Object.entries(maintenanceStatusCounts).map(
                ([status, count]) => (
                  <Alert
                    key={status}
                    severity="info"
                    icon={false}
                  >
                    {status.replaceAll("_", " ")}: {count}
                  </Alert>
                )
              )}
            </Stack>

            {maintenanceRecords.length === 0 ? (
              <Alert severity="info">
                No maintenance schedules found for these filters.
              </Alert>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={tableStyles}>
                  <thead>
                    <tr>
                      <th>Scheduled Date</th>
                      <th>Site</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {maintenanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.scheduled_date}</td>
                        <td>{record.site_name}</td>
                        <td>{record.title}</td>
                        <td>
                          {record.maintenance_type.replaceAll("_", " ")}
                        </td>
                        <td>
                          {record.assigned_to_name || "Unassigned"}
                        </td>
                        <td>
                          {record.status.replaceAll("_", " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==============================================
          FAULTS AND BREAKDOWNS REPORT
      ============================================== */}

      {reportRequested && category === "faults" && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Faults &amp; Breakdowns Report
            </Typography>

            <Typography color="text.secondary" sx={{ my: 2 }}>
              {startDate} to {endDate} · {breakdownRecords.length} breakdown(s)
            </Typography>

            <Stack
              direction="row"
              spacing={1}
             
              useFlexGap
              sx={{ mb: 2, flexWrap: 'wrap'}}
            >
              {Object.entries(breakdownStatusCounts).map(
                ([status, count]) => (
                  <Alert
                    key={status}
                    severity="info"
                    icon={false}
                  >
                    {status.replaceAll("_", " ")}: {count}
                  </Alert>
                )
              )}
            </Stack>

            {breakdownRecords.length === 0 ? (
              <Alert severity="info">
                No breakdown records found for these filters.
              </Alert>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={tableStyles}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Site</th>
                      <th>Title</th>
                      <th>Equipment</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>

                  <tbody>
                    {breakdownRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.breakdown_date}</td>
                        <td>{record.site_name}</td>
                        <td>{record.title}</td>
                        <td>{record.equipment_name || "—"}</td>
                        <td>{record.priority}</td>
                        <td>
                          {record.status.replaceAll("_", " ")}
                        </td>
                        <td>
                          {record.assigned_to_name || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==============================================
          MONTHLY SITE PERFORMANCE SUMMARY
      ============================================== */}

      {reportRequested && category === "site-performance" && (
        <>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600}}>
            Monthly Site Performance Summary
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {selectedMonthLabel} · {monthlyRecordCount} record(s)
          </Typography>

          {siteSummaries.length === 0 ? (
            <Alert severity="info">
              No generation records found for this month and site selection.
            </Alert>
          ) : (
            <>
              {/* MONTHLY TOTAL CARDS */}

              <Grid container spacing={2} sx={{ mb: 3 }}>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Total Actual Generation
                      </Typography>

                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatNumber(monthlyActual)} kWh
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Total Expected Generation
                      </Typography>

                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatNumber(monthlyExpected)} kWh
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Overall Performance
                      </Typography>

                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {monthlyPerformance === null
                          ? "N/A"
                          : `${formatNumber(monthlyPerformance)}%`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* SITE-WISE MONTHLY TABLE */}

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Site-wise Monthly Generation
                  </Typography>

                  <Typography color="text.secondary" sx={{ my: 2 }}>
                    Monthly generation breakdown by solar site.
                  </Typography>

                  <Box sx={{ overflowX: "auto" }}>
                    <Box component="table" sx={tableStyles}>
                      <thead>
                        <tr>
                          <th>Site</th>
                          <th>Records</th>
                          <th>Actual (kWh)</th>
                          <th>Expected (kWh)</th>
                          <th>Performance</th>
                        </tr>
                      </thead>

                      <tbody>
                        {siteSummaries.map((site) => {
                          const performance =
                            site.expected > 0
                              ? (site.performanceActual / site.expected) * 100
                              : null;

                          return (
                            <tr key={site.site}>
                              <td>{site.name}</td>
                              <td>{site.count}</td>
                              <td>{formatNumber(site.actual)}</td>
                              <td>{formatNumber(site.expected)}</td>

                              <td>
                                {performance === null
                                  ? "N/A"
                                  : `${formatNumber(performance)}%`}
                              </td>
                            </tr>
                          );
                        })}

                        {/* CONSOLIDATED TOTAL */}

                        <tr
                          style={{
                            fontWeight: 700,
                            backgroundColor: "#e3f2fd",
                          }}
                        >
                          <td>
                            {siteId === "all"
                              ? "TOTAL – ALL SITES"
                              : "SELECTED SITE TOTAL"}
                          </td>

                          <td>{monthlyRecordCount}</td>

                          <td>{formatNumber(monthlyActual)}</td>

                          <td>{formatNumber(monthlyExpected)}</td>

                          <td>
                            {monthlyPerformance === null
                              ? "N/A"
                              : `${formatNumber(monthlyPerformance)}%`}
                          </td>
                        </tr>
                      </tbody>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </Box>
  );
}
