import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ElectricMeterOutlinedIcon from "@mui/icons-material/ElectricMeterOutlined";
import AddIcon from "@mui/icons-material/Add";

import api from "../../api/axios";

import {
  getGenerationRecords,
  getMeterReadings,
  createGenerationRecord,
  createMeterReading,
  type GenerationRecord,
  type MeterReading,
  type CreateGenerationRecord,
  type CreateMeterReading,
} from "../../api/generation";

interface SiteOption {
  id: number;
  name: string;
  asset_code?: string;
}

interface GenerationForm {
  site: number | "";
  generation_date: string;
  generation_kwh: string;
  expected_generation_kwh: string;
  peak_power_kw: string;
  source: "MANUAL" | "API";
}

interface MeterReadingForm {
  site: number | "";
  reading_date: string;
  meter_serial_number: string;
  import_reading_kwh: string;
  export_reading_kwh: string;
  source: "MANUAL" | "API";
  remarks: string;
}

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialForm = (): GenerationForm => ({
  site: "",
  generation_date: getTodayDate(),
  generation_kwh: "",
  expected_generation_kwh: "",
  peak_power_kw: "",
  source: "MANUAL",
});

const initialMeterForm = (): MeterReadingForm => ({
  site: "",
  reading_date: getTodayDate(),
  meter_serial_number: "",
  import_reading_kwh: "",
  export_reading_kwh: "",
  source: "MANUAL",
  remarks: "",
});

const GenerationMeter: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);

  const [generationLoading, setGenerationLoading] = useState(false);
  const [meterLoading, setMeterLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [meterSaving, setMeterSaving] = useState(false);

  const [generationError, setGenerationError] = useState("");
  const [meterError, setMeterError] = useState("");
  const [formError, setFormError] = useState("");
  const [meterFormError, setMeterFormError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [meterDialogOpen, setMeterDialogOpen] = useState(false);

  const [form, setForm] = useState<GenerationForm>(initialForm);
  const [meterForm, setMeterForm] =
    useState<MeterReadingForm>(initialMeterForm);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error"
  >("success");

  // ==========================================================
  // LOAD GENERATION RECORDS
  // ==========================================================

  const loadGenerationRecords = useCallback(async () => {
    setGenerationLoading(true);
    setGenerationError("");

    try {
      const data = await getGenerationRecords();
      setRecords(data);
    } catch (error) {
      console.error("Failed to load generation records:", error);
      setGenerationError(
        "Unable to load generation records. Check your login and API connection."
      );
    } finally {
      setGenerationLoading(false);
    }
  }, []);

  // ==========================================================
  // LOAD METER READINGS
  // ==========================================================

  const loadMeterReadings = useCallback(async () => {
    setMeterLoading(true);
    setMeterError("");

    try {
      const data = await getMeterReadings();
      setMeterReadings(data);
    } catch (error) {
      console.error("Failed to load meter readings:", error);
      setMeterError(
        "Unable to load meter readings. Check your login and API connection."
      );
    } finally {
      setMeterLoading(false);
    }
  }, []);

  // ==========================================================
  // LOAD SITES FOR BOTH FORMS
  // ==========================================================

  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    setFormError("");
    setMeterFormError("");

    try {
      const response = await api.get<SiteOption[]>("/sites/");
      setSites(response.data);

      if (response.data.length === 0) {
        setFormError(
          "No sites found. Please create a site in Site Master first."
        );
      }
    } catch (error) {
      console.error("Failed to load sites:", error);

      const message =
        "Unable to load sites. Check the Site Master API and your login.";

      setFormError(message);
      setMeterFormError(message);
    } finally {
      setSitesLoading(false);
    }
  }, []);

  // ==========================================================
  // LOAD DATA WHEN CHANGING TABS
  // ==========================================================

  useEffect(() => {
    if (activeTab === 1) {
      void loadGenerationRecords();
    }

    if (activeTab === 2) {
      void loadMeterReadings();
    }
  }, [activeTab, loadGenerationRecords, loadMeterReadings]);

  // ==========================================================
  // GENERATION FORM OPEN / CLOSE
  // ==========================================================

  const openGenerationDialog = () => {
    setForm(initialForm());
    setFormError("");
    setDialogOpen(true);
    void loadSites();
  };

  const closeGenerationDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setFormError("");
  };

  const handleFormChange = (
    field: keyof GenerationForm,
    value: string | number
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================================
  // SAVE GENERATION RECORD
  // ==========================================================

  const handleSaveGeneration = async () => {
    setFormError("");

    if (!form.site) {
      setFormError("Please select a site.");
      return;
    }

    if (!form.generation_date) {
      setFormError("Please select the generation date.");
      return;
    }

    if (
      form.generation_kwh.trim() === "" ||
      !Number.isFinite(Number(form.generation_kwh)) ||
      Number(form.generation_kwh) < 0
    ) {
      setFormError("Enter a valid actual generation value.");
      return;
    }

    if (
      form.expected_generation_kwh.trim() !== "" &&
      (!Number.isFinite(Number(form.expected_generation_kwh)) ||
        Number(form.expected_generation_kwh) < 0)
    ) {
      setFormError("Enter a valid expected generation value.");
      return;
    }

    if (
      form.peak_power_kw.trim() !== "" &&
      (!Number.isFinite(Number(form.peak_power_kw)) ||
        Number(form.peak_power_kw) < 0)
    ) {
      setFormError("Enter a valid peak power value.");
      return;
    }

    const payload: CreateGenerationRecord = {
      site: Number(form.site),
      generation_date: form.generation_date,
      generation_kwh: form.generation_kwh.trim(),
      expected_generation_kwh:
        form.expected_generation_kwh.trim() === ""
          ? null
          : form.expected_generation_kwh.trim(),
      peak_power_kw:
        form.peak_power_kw.trim() === ""
          ? null
          : form.peak_power_kw.trim(),
      source: form.source,
      sync_status: "SUCCESS",
    };

    setSaving(true);

    try {
      await createGenerationRecord(payload);

      setDialogOpen(false);
      setSnackbarMessage("Generation record saved successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      await loadGenerationRecords();
    } catch (error: unknown) {
      console.error("Failed to save generation record:", error);
      setFormError(getApiErrorMessage(error, "generation"));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // METER READING FORM OPEN / CLOSE
  // ==========================================================

  const openMeterDialog = () => {
    setMeterForm(initialMeterForm());
    setMeterFormError("");
    setMeterDialogOpen(true);
    void loadSites();
  };

  const closeMeterDialog = () => {
    if (meterSaving) return;

    setMeterDialogOpen(false);
    setMeterFormError("");
  };

  const handleMeterFormChange = (
    field: keyof MeterReadingForm,
    value: string | number
  ) => {
    setMeterForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================================
  // SAVE METER READING
  // ==========================================================

  const handleSaveMeterReading = async () => {
    setMeterFormError("");

    if (!meterForm.site) {
      setMeterFormError("Please select a site.");
      return;
    }

    if (!meterForm.reading_date) {
      setMeterFormError("Please select the reading date.");
      return;
    }

    const importValue = meterForm.import_reading_kwh.trim();
    const exportValue = meterForm.export_reading_kwh.trim();

    if (importValue === "" && exportValue === "") {
      setMeterFormError(
        "Enter at least an import or export meter reading."
      );
      return;
    }

    if (
      (importValue !== "" &&
        (!Number.isFinite(Number(importValue)) ||
          Number(importValue) < 0)) ||
      (exportValue !== "" &&
        (!Number.isFinite(Number(exportValue)) ||
          Number(exportValue) < 0))
    ) {
      setMeterFormError(
        "Meter readings must be valid numbers greater than or equal to zero."
      );
      return;
    }

    const payload: CreateMeterReading = {
      site: Number(meterForm.site),
      reading_date: meterForm.reading_date,
      meter_serial_number: meterForm.meter_serial_number.trim(),
      import_reading_kwh: importValue === "" ? null : importValue,
      export_reading_kwh: exportValue === "" ? null : exportValue,
      source: meterForm.source,
      remarks: meterForm.remarks.trim(),
    };

    setMeterSaving(true);

    try {
      await createMeterReading(payload);

      setMeterDialogOpen(false);
      setSnackbarMessage("Meter reading saved successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      await loadMeterReadings();
    } catch (error: unknown) {
      console.error("Failed to save meter reading:", error);
      setMeterFormError(getApiErrorMessage(error, "meter"));
    } finally {
      setMeterSaving(false);
    }
  };

  // ==========================================================
  // API ERROR MESSAGE
  // ==========================================================

  function getApiErrorMessage(
    error: unknown,
    formType: "generation" | "meter"
  ): string {
    const fallback =
      formType === "generation"
        ? "Unable to save the generation record. Check the entered details."
        : "Unable to save the meter reading. Check the entered details.";

    if (
      typeof error !== "object" ||
      error === null ||
      !("response" in error)
    ) {
      return fallback;
    }

    const response = (
      error as {
        response?: {
          data?: Record<string, unknown> | string;
        };
      }
    ).response;

    const data = response?.data;

    if (typeof data === "string") {
      return data;
    }

    if (!data) {
      return fallback;
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.non_field_errors)) {
      return data.non_field_errors.join(" ");
    }

    const firstError = Object.values(data).flat()[0];

    return typeof firstError === "string" ? firstError : fallback;
  }

  // ==========================================================
  // FORMATTING HELPERS
  // ==========================================================

  const formatNumber = (
    value: string | number | null | undefined
  ): string => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return number.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value: string): string => {
    if (!value) return "—";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================================
  // SUMMARY VALUES
  // ==========================================================

  const totalGeneration = records.reduce(
    (total, record) => total + Number(record.generation_kwh || 0),
    0
  );

  const averagePerformanceRecords = records.filter(
    (record) => record.performance_percentage !== null
  );

  const averagePerformance =
    averagePerformanceRecords.length > 0
      ? averagePerformanceRecords.reduce(
          (total, record) =>
            total + Number(record.performance_percentage || 0),
          0
        ) / averagePerformanceRecords.length
      : null;

  const latestGenerationDate =
    records.length > 0 ? formatDate(records[0].generation_date) : "—";

  const renderLoading = () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 6,
      }}
    >
      <CircularProgress size={28} />
      <Typography sx={{ ml: 2 }} color="text.secondary">
        Loading records...
      </Typography>
    </Box>
  );

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <Box sx={{ width: "100%", pb: 3 }}>
      {/* PAGE HEADER */}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Generation &amp; Meter
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Monitor solar generation and electricity meter readings.
          </Typography>
        </Box>

        {activeTab === 1 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openGenerationDialog}
            >
              Add Generation Record
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => void loadGenerationRecords()}
              disabled={generationLoading}
            >
              Refresh
            </Button>
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openMeterDialog}
            >
              Add Meter Reading
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => void loadMeterReadings()}
              disabled={meterLoading}
            >
              Refresh
            </Button>
          </Stack>
        )}
      </Box>

      {/* MAIN CONTENT */}

      <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue: number) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Generation and meter sections"
            sx={{
              px: { xs: 1, sm: 2 },
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 56,
                fontWeight: 500,
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Daily Generation" />
            <Tab label="Meter Readings" />
            <Tab label="Monthly Summary" />
            <Tab label="API / Sync" />
          </Tabs>
        </Box>

        {/* OVERVIEW */}

        {activeTab === 0 && (
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Generation Overview
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Open Daily Generation or Meter Readings to load records from the
              backend.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <BoltOutlinedIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Loaded Generation Records
                  </Typography>
                </Stack>

                <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>
                  {records.length}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ElectricMeterOutlinedIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Loaded Meter Readings
                  </Typography>
                </Stack>

                <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>
                  {meterReadings.length}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Loaded Generation
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ mt: 2, overflowWrap: "anywhere" }}
                >
                  {formatNumber(totalGeneration)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  kWh across currently loaded records
                </Typography>
              </Paper>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              Summary values update as you load records. They are not yet a
              complete all-sites or monthly report.
            </Alert>
          </CardContent>
        )}

        {/* DAILY GENERATION */}

        {activeTab === 1 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Daily Generation
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Daily solar generation records retrieved from Django.
                </Typography>
              </Box>

              <Chip
                label={`${records.length} record${
                  records.length === 1 ? "" : "s"
                }`}
                variant="outlined"
              />
            </Box>

            {generationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {generationError}
              </Alert>
            )}

            {generationLoading ? (
              renderLoading()
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2, overflowX: "auto" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Site</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actual (kWh)</TableCell>
                      <TableCell align="right">Expected (kWh)</TableCell>
                      <TableCell align="right">Performance</TableCell>
                      <TableCell align="right">Peak Power (kW)</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.site_name || "—"}</TableCell>
                        <TableCell>
                          {formatDate(record.generation_date)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(record.generation_kwh)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(record.expected_generation_kwh)}
                        </TableCell>
                        <TableCell align="right">
                          {record.performance_percentage === null
                            ? "—"
                            : `${formatNumber(
                                record.performance_percentage
                              )}%`}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(record.peak_power_kw)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={record.source}
                            color={
                              record.source === "API" ? "info" : "default"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={record.sync_status}
                            color={
                              record.sync_status === "SUCCESS"
                                ? "success"
                                : record.sync_status === "FAILED"
                                  ? "error"
                                  : "warning"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {records.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No generation records found.
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Use Add Generation Record to enter your first
                            record.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* METER READINGS */}

        {activeTab === 2 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Meter Readings
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Cumulative electricity import and export readings.
                </Typography>
              </Box>

              <Chip
                label={`${meterReadings.length} record${
                  meterReadings.length === 1 ? "" : "s"
                }`}
                variant="outlined"
              />
            </Box>

            {meterError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {meterError}
              </Alert>
            )}

            {meterLoading ? (
              renderLoading()
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2, overflowX: "auto" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Site</TableCell>
                      <TableCell>Reading Date</TableCell>
                      <TableCell>Meter Serial No.</TableCell>
                      <TableCell align="right">Import (kWh)</TableCell>
                      <TableCell align="right">Export (kWh)</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Logged By</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {meterReadings.map((reading) => (
                      <TableRow key={reading.id} hover>
                        <TableCell>{reading.site_name || "—"}</TableCell>
                        <TableCell>
                          {formatDate(reading.reading_date)}
                        </TableCell>
                        <TableCell>
                          {reading.meter_serial_number || "—"}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(reading.import_reading_kwh)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(reading.export_reading_kwh)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={reading.source}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {reading.logged_by_name || "—"}
                        </TableCell>
                        <TableCell>{reading.remarks || "—"}</TableCell>
                      </TableRow>
                    ))}

                    {meterReadings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">
                            No meter readings found.
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Select Add Meter Reading to enter your first
                            reading.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* MONTHLY SUMMARY */}

        {activeTab === 3 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Monthly Summary
            </Typography>

            <Alert severity="info">
              Monthly generation totals, expected generation, and performance
              comparisons will be implemented after daily records and data
              entry are complete.
            </Alert>
          </Box>
        )}

        {/* API / SYNC */}

        {activeTab === 4 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              API / Sync
            </Typography>

            <Alert severity="info">
              Vendor API configuration and synchronization history will be
              implemented later. Generation records already support API and
              manual data sources.
            </Alert>
          </Box>
        )}
      </Card>

      {/* DAILY GENERATION SUMMARY */}

      {activeTab === 1 && !generationLoading && !generationError && (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total Generation
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
              {formatNumber(totalGeneration)} kWh
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Average Performance
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
              {averagePerformance === null
                ? "—"
                : `${formatNumber(averagePerformance)}%`}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Latest Generation Date
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
              {latestGenerationDate}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* ADD GENERATION RECORD DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={closeGenerationDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Add Generation Record
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter the solar generation details for one site and date.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth required disabled={sitesLoading || saving}>
              <InputLabel id="generation-site-label">Site</InputLabel>
              <Select
                labelId="generation-site-label"
                label="Site"
                value={form.site}
                onChange={(event) =>
                  handleFormChange("site", event.target.value as number)
                }
              >
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                    {site.asset_code ? ` (${site.asset_code})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {sitesLoading && (
              <Typography variant="caption" color="text.secondary">
                Loading sites...
              </Typography>
            )}

            {!sitesLoading && sites.length === 0 && (
              <Alert severity="warning">
                No sites are available. Add a site in Site Master first.
              </Alert>
            )}

            <TextField
              label="Generation Date"
              type="date"
              value={form.generation_date}
              onChange={(event) =>
                handleFormChange("generation_date", event.target.value)
              }
              fullWidth
              required
              disabled={saving}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Actual Generation (kWh)"
              type="number"
              value={form.generation_kwh}
              onChange={(event) =>
                handleFormChange("generation_kwh", event.target.value)
              }
              fullWidth
              required
              disabled={saving}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              helperText="Actual energy generated by the solar system."
            />

            <TextField
              label="Expected Generation (kWh)"
              type="number"
              value={form.expected_generation_kwh}
              onChange={(event) =>
                handleFormChange(
                  "expected_generation_kwh",
                  event.target.value
                )
              }
              fullWidth
              disabled={saving}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            />

            <TextField
              label="Peak Power (kW)"
              type="number"
              value={form.peak_power_kw}
              onChange={(event) =>
                handleFormChange("peak_power_kw", event.target.value)
              }
              fullWidth
              disabled={saving}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            />

            <FormControl fullWidth disabled={saving}>
              <InputLabel id="generation-source-label">Data Source</InputLabel>
              <Select
                labelId="generation-source-label"
                label="Data Source"
                value={form.source}
                onChange={(event) =>
                  handleFormChange(
                    "source",
                    event.target.value as "MANUAL" | "API"
                  )
                }
              >
                <MenuItem value="MANUAL">Manual Entry</MenuItem>
                <MenuItem value="API">Vendor API</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              Performance percentage is calculated by the Django backend when
              expected generation is provided.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeGenerationDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveGeneration()}
            disabled={saving || sitesLoading || sites.length === 0}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
          >
            {saving ? "Saving..." : "Save Record"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD METER READING DIALOG */}

      <Dialog
        open={meterDialogOpen}
        onClose={closeMeterDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Add Meter Reading
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter the cumulative import/export reading for a site.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {meterFormError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {meterFormError}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl
              fullWidth
              required
              disabled={sitesLoading || meterSaving}
            >
              <InputLabel id="meter-site-label">Site</InputLabel>
              <Select
                labelId="meter-site-label"
                label="Site"
                value={meterForm.site}
                onChange={(event) =>
                  handleMeterFormChange("site", event.target.value as number)
                }
              >
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                    {site.asset_code ? ` (${site.asset_code})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Reading Date"
              type="date"
              value={meterForm.reading_date}
              onChange={(event) =>
                handleMeterFormChange("reading_date", event.target.value)
              }
              fullWidth
              required
              disabled={meterSaving}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Meter Serial Number"
              value={meterForm.meter_serial_number}
              onChange={(event) =>
                handleMeterFormChange(
                  "meter_serial_number",
                  event.target.value
                )
              }
              fullWidth
              disabled={meterSaving}
            />

            <TextField
              label="Import Reading (kWh)"
              type="number"
              value={meterForm.import_reading_kwh}
              onChange={(event) =>
                handleMeterFormChange(
                  "import_reading_kwh",
                  event.target.value
                )
              }
              fullWidth
              disabled={meterSaving}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              helperText="Cumulative electricity imported from the grid."
            />

            <TextField
              label="Export Reading (kWh)"
              type="number"
              value={meterForm.export_reading_kwh}
              onChange={(event) =>
                handleMeterFormChange(
                  "export_reading_kwh",
                  event.target.value
                )
              }
              fullWidth
              disabled={meterSaving}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              helperText="Cumulative electricity exported to the grid."
            />

            <FormControl fullWidth disabled={meterSaving}>
              <InputLabel id="meter-source-label">Data Source</InputLabel>
              <Select
                labelId="meter-source-label"
                label="Data Source"
                value={meterForm.source}
                onChange={(event) =>
                  handleMeterFormChange(
                    "source",
                    event.target.value as "MANUAL" | "API"
                  )
                }
              >
                <MenuItem value="MANUAL">Manual Entry</MenuItem>
                <MenuItem value="API">Vendor API</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Remarks"
              value={meterForm.remarks}
              onChange={(event) =>
                handleMeterFormChange("remarks", event.target.value)
              }
              fullWidth
              multiline
              minRows={2}
              disabled={meterSaving}
            />

            <Alert severity="info">
              Enter at least one meter reading. These are cumulative meter
              values, not daily generation figures.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeMeterDialog} disabled={meterSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveMeterReading()}
            disabled={
              meterSaving ||
              sitesLoading ||
              sites.length === 0
            }
            startIcon={
              meterSaving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
          >
            {meterSaving ? "Saving..." : "Save Reading"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUCCESS / ERROR MESSAGE */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSnackbarOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GenerationMeter;