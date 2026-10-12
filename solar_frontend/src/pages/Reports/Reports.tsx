
import { useState } from "react";
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

const reportCategories = [
  { value: "generation", label: "Generation Report" },
  { value: "maintenance", label: "Maintenance Report" },
  { value: "faults", label: "Faults & Breakdowns Report" },
  { value: "site-performance", label: "Site Performance Summary" },
];

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

type SiteSummary = {
  site: number;
  name: string;
  count: number;
  actual: number;
  expected: number;
  expectedRecordCount: number;
};

export default function Reports() {
  const today = new Date().toLocaleDateString("en-CA");
  const firstDay = `${today.slice(0, 7)}-01`;

  const [category, setCategory] = useState("generation");
  const [siteId, setSiteId] = useState("all");
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);

  const [generationRecords, setGenerationRecords] = useState<
    GenerationRecord[]
  >([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceSchedule[]
  >([]);
  const [breakdownRecords, setBreakdownRecords] = useState<Breakdown[]>([]);

  const [reportRequested, setReportRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatNumber = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      setReportRequested(false);
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after the end date.");
      setReportRequested(false);
      return;
    }

    setLoading(true);
    setError("");
    setReportRequested(false);

    try {
      if (category === "generation" || category === "site-performance") {
        const records = await getGenerationRecords();

        const filtered = records.filter((record) => {
          const matchesSite =
            siteId === "all" || String(record.site) === siteId;

          return (
            matchesSite &&
            record.generation_date >= startDate &&
            record.generation_date <= endDate
          );
        });

        setGenerationRecords(filtered);
      } else if (category === "maintenance") {
        const records = await getMaintenanceSchedules();

        const filtered = records.filter((record) => {
          const matchesSite =
            siteId === "all" || String(record.site) === siteId;

          return (
            matchesSite &&
            record.scheduled_date >= startDate &&
            record.scheduled_date <= endDate
          );
        });

        setMaintenanceRecords(filtered);
      } else if (category === "faults") {
        const records = await getBreakdowns();

        const filtered = records.filter((record) => {
          const matchesSite =
            siteId === "all" || String(record.site) === siteId;

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
        "Unable to load report data. Check that Django is running, the API endpoint is available, and you are logged in.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Build site choices from records loaded from the existing APIs.
  const siteOptions = new Map<number, string>();

  generationRecords.forEach((record) =>
    siteOptions.set(record.site, record.site_name),
  );

  maintenanceRecords.forEach((record) =>
    siteOptions.set(record.site, record.site_name),
  );

  breakdownRecords.forEach((record) =>
    siteOptions.set(record.site, record.site_name),
  );

  const totalGeneration = generationRecords.reduce(
    (total, record) => total + Number(record.generation_kwh || 0),
    0,
  );

  const totalExpected = generationRecords.reduce(
    (total, record) =>
      total + Number(record.expected_generation_kwh || 0),
    0,
  );

  const recordsWithExpected = generationRecords.filter(
    (record) =>
      record.expected_generation_kwh !== null &&
      Number(record.expected_generation_kwh) > 0,
  );

  const actualForPerformance = recordsWithExpected.reduce(
    (total, record) => total + Number(record.generation_kwh || 0),
    0,
  );

  const expectedForPerformance = recordsWithExpected.reduce(
    (total, record) =>
      total + Number(record.expected_generation_kwh || 0),
    0,
  );

  const overallPerformance =
    expectedForPerformance > 0
      ? (actualForPerformance / expectedForPerformance) * 100
      : null;

  const maintenanceStatusCounts = maintenanceRecords.reduce<
    Record<string, number>
  >((counts, record) => {
    counts[record.status] = (counts[record.status] || 0) + 1;
    return counts;
  }, {});

  const breakdownStatusCounts = breakdownRecords.reduce<
    Record<string, number>
  >((counts, record) => {
    counts[record.status] = (counts[record.status] || 0) + 1;
    return counts;
  }, {});

  const siteSummaries = Array.from(
    generationRecords.reduce((groups, record) => {
      const current: SiteSummary = groups.get(record.site) ?? {
        site: record.site,
        name: record.site_name,
        count: 0,
        actual: 0,
        expected: 0,
        expectedRecordCount: 0,
      };

      current.count += 1;
      current.actual += Number(record.generation_kwh || 0);

      if (
        record.expected_generation_kwh !== null &&
        Number(record.expected_generation_kwh) > 0
      ) {
        current.expected += Number(record.expected_generation_kwh);
        current.expectedRecordCount += 1;
      }

      groups.set(record.site, current);
      return groups;
    }, new Map<number, SiteSummary>()).values(),
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
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

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Report Filters
          </Typography>

          <Grid container spacing={2}>
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
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

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
                <MenuItem value="all">All Sites</MenuItem>
                {Array.from(siteOptions.entries()).map(([id, name]) => (
                  <MenuItem key={id} value={String(id)}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

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
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

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
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Report Results
      </Typography>

      {!reportRequested && !error && (
        <Card variant="outlined">
          <CardContent sx={{ py: 5, textAlign: "center" }}>
            <AssessmentOutlinedIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="h6">No Report Generated</Typography>
            <Typography color="text.secondary">
              Select your filters and click Generate Report to begin.
            </Typography>
          </CardContent>
        </Card>
      )}

      {reportRequested && category === "generation" && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary">
                    Total Generation
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
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
                  <Typography variant="h5" fontWeight={700}>
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
                  <Typography variant="h5" fontWeight={700}>
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
              <Typography variant="h6" fontWeight={600}>
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
                            {formatNumber(Number(record.generation_kwh || 0))}
                          </td>
                          <td>
                            {record.expected_generation_kwh === null
                              ? "N/A"
                              : formatNumber(
                                  Number(record.expected_generation_kwh),
                                )}
                          </td>
                          <td>
                            {record.performance_percentage === null
                              ? "N/A"
                              : `${formatNumber(record.performance_percentage)}%`}
                          </td>
                          <td>
                            {record.peak_power_kw === null
                              ? "N/A"
                              : formatNumber(Number(record.peak_power_kw))}
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

      {reportRequested && category === "maintenance" && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              Maintenance Report
            </Typography>
            <Typography color="text.secondary" sx={{ my: 2 }}>
              {startDate} to {endDate} · {maintenanceRecords.length} task(s)
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 2 }}
            >
              {Object.entries(maintenanceStatusCounts).map(([status, count]) => (
                <Alert key={status} severity="info" icon={false}>
                  {status.replaceAll("_", " ")}: {count}
                </Alert>
              ))}
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
                        <td>{record.maintenance_type.replaceAll("_", " ")}</td>
                        <td>{record.assigned_to_name || "Unassigned"}</td>
                        <td>{record.status.replaceAll("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {reportRequested && category === "faults" && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              Faults &amp; Breakdowns Report
            </Typography>
            <Typography color="text.secondary" sx={{ my: 2 }}>
              {startDate} to {endDate} · {breakdownRecords.length} breakdown(s)
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 2 }}
            >
              {Object.entries(breakdownStatusCounts).map(([status, count]) => (
                <Alert key={status} severity="info" icon={false}>
                  {status.replaceAll("_", " ")}: {count}
                </Alert>
              ))}
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
                        <td>{record.status.replaceAll("_", " ")}</td>
                        <td>{record.assigned_to_name || "Unassigned"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {reportRequested && category === "site-performance" && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              Site Performance Summary
            </Typography>
            <Typography color="text.secondary" sx={{ my: 2 }}>
              {startDate} to {endDate}
            </Typography>

            {siteSummaries.length === 0 ? (
              <Alert severity="info">
                No generation records found for this period.
              </Alert>
            ) : (
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
                    {siteSummaries.map((site) => (
                      <tr key={site.site}>
                        <td>{site.name}</td>
                        <td>{site.count}</td>
                        <td>{formatNumber(site.actual)}</td>
                        <td>{formatNumber(site.expected)}</td>
                        <td>
                          {site.expectedRecordCount === 0 || site.expected <= 0
                            ? "N/A"
                            : `${formatNumber(
                                (site.actual / site.expected) * 100,
                              )}%`}
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
    </Box>
  );
}
