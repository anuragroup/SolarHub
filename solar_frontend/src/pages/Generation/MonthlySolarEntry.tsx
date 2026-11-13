import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

import api from "../../api/axios";

/* ============================================================
   TYPES
============================================================ */

interface SiteOption {
  id: number;
  name: string;
  asset_code?: string;
  expected_monthly_generation: string | number;
}

interface MonthlyRecord {
  id: number;
  site: number;
  site_name: string;
  site_asset_code?: string;

  year: number;
  month: number;
  entry_mode: string;

  expected_generation_kwh: string | number;
  actual_generation_kwh: string | number;

  actual_import_units: string | number;
  actual_export_units: string | number;

  import_rate: string | number;

  bill_value: string | number;
  balance_bill: string | number;
  total_bill: string | number;

  performance_percentage: number | null;

  remarks: string;
  entered_by_name?: string;

  created_at: string;
  updated_at: string;
}

interface MonthlyForm {
  actual_generation_kwh: string;
  actual_import_units: string;
  actual_export_units: string;
  import_rate: string;
  balance_bill: string;
  remarks: string;
}

/* ============================================================
   CONSTANTS
============================================================ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentDate = new Date();

const emptyForm = (): MonthlyForm => ({
  actual_generation_kwh: "",
  actual_import_units: "",
  actual_export_units: "",
  import_rate: "",
  balance_bill: "0",
  remarks: "",
});

/* ============================================================
   HELPERS
============================================================ */

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

const formatMoney = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return `Rs. ${formatNumber(value)}`;
};

const unwrapArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getApiErrorMessage = (error: any): string => {
  const data = error?.response?.data;

  if (data?.detail) {
    return data.detail;
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : String(value);

        return `${key}: ${message}`;
      })
      .join(" ");
  }

  return "An unexpected error occurred. Please try again.";
};

/* ============================================================
   COMPONENT
============================================================ */

const MonthlySolarEntry: React.FC = () => {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);

  const [selectedSite, setSelectedSite] = useState<number | "">("");

  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );

  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear()
  );

  const [editingRecord, setEditingRecord] =
    useState<MonthlyRecord | null>(null);

  const [form, setForm] = useState<MonthlyForm>(emptyForm());

  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingSelectedMonth, setLoadingSelectedMonth] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  /* ==========================================================
     SELECTED SITE
  ========================================================== */

  const selectedSiteDetails = useMemo(
    () => sites.find((site) => site.id === Number(selectedSite)),
    [sites, selectedSite]
  );

  const expectedGeneration =
    selectedSiteDetails?.expected_monthly_generation ?? 0;

  /* ==========================================================
     YEARS
  ========================================================== */

  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();

    return Array.from(
      { length: 8 },
      (_, index) => currentYear - 5 + index
    );
  }, []);

  /* ==========================================================
     CALCULATIONS
  ========================================================== */

  const calculatedBillValue = useMemo(() => {
    const actualGeneration = Number(form.actual_generation_kwh);
    const exportUnits = Number(form.actual_export_units);
    const importUnits = Number(form.actual_import_units);
    const importRate = Number(form.import_rate);

    if (
      form.actual_generation_kwh.trim() === "" ||
      form.actual_export_units.trim() === "" ||
      form.actual_import_units.trim() === "" ||
      form.import_rate.trim() === ""
    ) {
      return null;
    }

    if (
      !Number.isFinite(actualGeneration) ||
      !Number.isFinite(exportUnits) ||
      !Number.isFinite(importUnits) ||
      !Number.isFinite(importRate)
    ) {
      return null;
    }

    return (
      (actualGeneration - exportUnits + importUnits) *
      importRate
    );
  }, [
    form.actual_generation_kwh,
    form.actual_export_units,
    form.actual_import_units,
    form.import_rate,
  ]);

  const calculatedTotalBill = useMemo(() => {
    if (calculatedBillValue === null) {
      return null;
    }

    const balanceBill =
      form.balance_bill.trim() === ""
        ? 0
        : Number(form.balance_bill);

    if (!Number.isFinite(balanceBill)) {
      return null;
    }

    return calculatedBillValue + balanceBill;
  }, [calculatedBillValue, form.balance_bill]);

  const performance = useMemo(() => {
    const expected = Number(expectedGeneration);
    const actual = Number(form.actual_generation_kwh);

    if (
      expected <= 0 ||
      form.actual_generation_kwh.trim() === "" ||
      !Number.isFinite(actual)
    ) {
      return null;
    }

    return (actual / expected) * 100;
  }, [expectedGeneration, form.actual_generation_kwh]);

  /* ==========================================================
     LOAD SITES
  ========================================================== */

  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    setError("");

    try {
      const response = await api.get("/sites/");

      const data = unwrapArray<SiteOption>(response.data);

      setSites(data);

      if (data.length > 0) {
        setSelectedSite((previous) =>
          previous || data[0].id
        );
      }
    } catch (error) {
      console.error("Failed to load sites:", error);
      setError("Unable to load sites. Please check the API.");
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  /* ==========================================================
     LOAD MONTHLY HISTORY
  ========================================================== */

  const loadRecords = useCallback(async () => {
    if (!selectedSite) {
      setRecords([]);
      return;
    }

    setLoadingRecords(true);

    try {
      const response = await api.get(
        "/monthly-solar-records/",
        {
          params: {
            site: selectedSite,
            year: selectedYear,
          },
        }
      );

      setRecords(
        unwrapArray<MonthlyRecord>(response.data)
      );
    } catch (error) {
      console.error("Failed to load monthly records:", error);
      setError("Unable to load monthly solar records.");
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedSite, selectedYear]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const handleChange = (
    field: keyof MonthlyForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* ==========================================================
     LOAD SELECTED MONTH
  ========================================================== */

  const loadSelectedMonth = useCallback(async () => {
    if (!selectedSite) {
      setForm(emptyForm());
      setEditingRecord(null);
      return;
    }

    setLoadingSelectedMonth(true);
    setError("");

    try {
      const response = await api.get(
        "/monthly-solar-records/",
        {
          params: {
            site: selectedSite,
            year: selectedYear,
            month: selectedMonth,
          },
        }
      );

      const data = unwrapArray<MonthlyRecord>(response.data);

      if (data.length > 0) {
        const record = data[0];

        setEditingRecord(record);

        setForm({
          actual_generation_kwh: String(
            record.actual_generation_kwh ?? ""
          ),

          actual_import_units: String(
            record.actual_import_units ?? ""
          ),

          actual_export_units: String(
            record.actual_export_units ?? ""
          ),

          import_rate: String(
            record.import_rate ?? ""
          ),

          balance_bill: String(
            record.balance_bill ?? "0"
          ),

          remarks: record.remarks || "",
        });
      } else {
        setEditingRecord(null);
        setForm(emptyForm());
      }
    } catch (error) {
      console.error("Failed to load selected month:", error);
      setError(
        "Unable to retrieve the selected month's record."
      );

      setForm(emptyForm());
      setEditingRecord(null);
    } finally {
      setLoadingSelectedMonth(false);
    }
  }, [selectedSite, selectedYear, selectedMonth]);

  useEffect(() => {
    void loadSelectedMonth();
  }, [loadSelectedMonth]);

  /* ==========================================================
     EDIT EXISTING RECORD FROM HISTORY TABLE
  ========================================================== */

  const handleEditRecord = (record: MonthlyRecord) => {
    setSelectedSite(record.site);
    setSelectedYear(record.year);
    setSelectedMonth(record.month);

    setEditingRecord(record);

    setForm({
      actual_generation_kwh: String(
        record.actual_generation_kwh ?? ""
      ),

      actual_import_units: String(
        record.actual_import_units ?? ""
      ),

      actual_export_units: String(
        record.actual_export_units ?? ""
      ),

      import_rate: String(
        record.import_rate ?? ""
      ),

      balance_bill: String(
        record.balance_bill ?? "0"
      ),

      remarks: record.remarks || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validateNumber = (
    value: string,
    label: string,
    required = false
  ): string | null => {
    if (value.trim() === "") {
      return required ? `${label} is required.` : null;
    }

    if (
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    ) {
      return `${label} must be a valid non-negative number.`;
    }

    return null;
  };

  const validateForm = (): boolean => {
    if (!selectedSite) {
      setError("Please select a site.");
      return false;
    }

    const fields: [
      keyof MonthlyForm,
      string,
      boolean
    ][] = [
      [
        "actual_generation_kwh",
        "Actual generation",
        true,
      ],
      [
        "actual_import_units",
        "Import units",
        true,
      ],
      [
        "actual_export_units",
        "Export units",
        true,
      ],
      [
        "import_rate",
        "Import rate",
        true,
      ],
      [
        "balance_bill",
        "Balance bill",
        true,
      ],
    ];

    for (const [field, label, required] of fields) {
      const validationError = validateNumber(
        form[field],
        label,
        required
      );

      if (validationError) {
        setError(validationError);
        return false;
      }
    }

    return true;
  };

  /* ==========================================================
     SAVE MONTHLY RECORD
  ========================================================== */

  const handleSave = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      site: Number(selectedSite),
      year: selectedYear,
      month: selectedMonth,
      entry_mode: "MONTHLY_MANUAL",

      actual_generation_kwh:
        form.actual_generation_kwh.trim(),

      actual_import_units:
        form.actual_import_units.trim(),

      actual_export_units:
        form.actual_export_units.trim(),

      import_rate:
        form.import_rate.trim(),

      balance_bill:
        form.balance_bill.trim(),

      remarks: form.remarks.trim(),
    };

    setSaving(true);

    try {
      if (editingRecord) {
        await api.patch(
          `/monthly-solar-records/${editingRecord.id}/`,
          payload
        );

        setSuccessMessage(
          "Monthly solar record updated successfully."
        );
      } else {
        await api.post(
          "/monthly-solar-records/",
          payload
        );

        setSuccessMessage(
          "Monthly solar record saved successfully."
        );
      }

      setSnackbarOpen(true);

      await loadRecords();
      await loadSelectedMonth();
    } catch (error: any) {
      console.error("Failed to save monthly record:", error);
      setError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    await loadSites();
    await loadRecords();
    await loadSelectedMonth();
  };

  /* ==========================================================
     NEW ENTRY / RESET
  ========================================================== */

  const handleNewEntry = () => {
    // Reload the selected month.
    // If a record already exists, it will be loaded for editing.
    // If no record exists, the form will be cleared.
    void loadSelectedMonth();
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Box sx={{ width: "100%", pb: 4 }}>

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
        <Typography
  variant="h5"
  sx={{ fontWeight: 700 }}
>
  Monthly Solar Entry
</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Enter and monitor monthly solar generation,
            electricity units and electricity bills.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void handleRefresh()}
            disabled={
              loadingRecords ||
              loadingSites ||
              loadingSelectedMonth
            }
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewEntry}
            disabled={!selectedSite || saving}
          >
            Reload Month
          </Button>
        </Stack>
      </Box>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* SITE AND PERIOD SELECTION */}

      <Card
        variant="outlined"
        sx={{ borderRadius: 2, mb: 3 }}
      >
        <CardContent>
         <Typography
  variant="subtitle1"
  sx={{ mb: 2, fontWeight: 700 }}
>
            Site and Reporting Period
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "2fr 1fr 1fr",
              },
              gap: 2,
            }}
          >
            <FormControl
              fullWidth
              disabled={loadingSites}
            >
              <InputLabel>Solar Site</InputLabel>

              <Select
                value={selectedSite}
                label="Solar Site"
                onChange={(event) => {
                  setSelectedSite(
                    Number(event.target.value)
                  );
                  setEditingRecord(null);
                }}
              >
                {sites.map((site) => (
                  <MenuItem
                    key={site.id}
                    value={site.id}
                  >
                    {site.name}
                    {site.asset_code
                      ? ` (${site.asset_code})`
                      : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>

              <Select
                value={selectedMonth}
                label="Month"
                onChange={(event) => {
                  setSelectedMonth(
                    Number(event.target.value)
                  );
                  setEditingRecord(null);
                }}
              >
                {MONTHS.map((month, index) => (
                  <MenuItem
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>

              <Select
                value={selectedYear}
                label="Year"
                onChange={(event) => {
                  setSelectedYear(
                    Number(event.target.value)
                  );
                  setEditingRecord(null);
                }}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* SITE CONFIGURATION */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 2 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Expected Monthly Generation
          </Typography>

          <Typography
            variant="h5"
             sx={{ mt: 1, fontWeight: 700 }}
          >
            {formatNumber(expectedGeneration)} kWh
          </Typography>

          <Typography
            variant="caption"
            color="success.main"
          >
            Automatically retrieved from Site Master
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 2 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Selected Reporting Period
          </Typography>

         <Typography
  variant="h5"
  sx={{ mt: 1, fontWeight: 700 }}
>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Monthly solar performance and billing
          </Typography>
        </Paper>
      </Box>

      {/* MONTHLY ENTRY FORM */}

      <Card
        variant="outlined"
        sx={{ borderRadius: 2, mb: 3 }}
      >
        <CardContent
          sx={{ p: { xs: 2, sm: 3 } }}
        >

          {/* FORM HEADER */}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              gap: 1,
            }}
          >
            <Box>
              <Typography
                variant="h6"
               sx={{ mb: 2, fontWeight: 700 }}
              >
                {editingRecord
                  ? "Edit Monthly Record"
                  : "Monthly Data Entry"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </Typography>
            </Box>

            <Chip
              label={
                editingRecord
                  ? "Existing Record"
                  : "New Record"
              }
              color={
                editingRecord ? "info" : "success"
              }
              variant="outlined"
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {loadingSelectedMonth ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>

              {/* 1. SOLAR GENERATION */}

              <Typography
                variant="subtitle1"
               sx={{ mb: 2, fontWeight: 700 }}
              >
                1. Solar Generation
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="Actual Monthly Generation (kWh)"
                  type="number"
                  required
                  value={form.actual_generation_kwh}
                  onChange={(event) =>
                    handleChange(
                      "actual_generation_kwh",
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                  }}
                  helperText="Enter the total actual solar generation for this month."
                  fullWidth
                />

                <TextField
                  label="Expected Monthly Generation (kWh)"
                  value={formatNumber(expectedGeneration)}
                  fullWidth
                  disabled
                  helperText="Automatically retrieved from Site Master."
                />
              </Box>

              {/* 2. ELECTRICITY INFORMATION */}

              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                2. Electricity Information
              </Typography>

              <Typography
                variant="body2"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                Import Information
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="Import Units (kWh)"
                  type="number"
                  required
                  value={form.actual_import_units}
                  onChange={(event) =>
                    handleChange(
                      "actual_import_units",
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                  }}
                  helperText="Enter the total electricity imported during the month."
                  fullWidth
                />

                <TextField
                  label="Import Rate (Rs. / kWh)"
                  type="number"
                  required
                  value={form.import_rate}
                  onChange={(event) =>
                    handleChange(
                      "import_rate",
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                  }}
                  helperText="Enter the applicable import rate for this month."
                  fullWidth
                />
              </Box>

              <Typography
                variant="body2"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                Export Information
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="Export Units (kWh)"
                  type="number"
                  required
                  value={form.actual_export_units}
                  onChange={(event) =>
                    handleChange(
                      "actual_export_units",
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                  }}
                  helperText="Enter the total electricity exported during the month."
                  fullWidth
                />

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Monthly Import Rate
                  </Typography>

                 <Typography
  variant="subtitle1"
  sx={{ mt: 1, mb: 1, fontWeight: 600 }}
>
                    {form.import_rate.trim() === ""
                      ? "—"
                      : formatMoney(form.import_rate)}
                    {form.import_rate.trim() !== "" &&
                      " / kWh"}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Based on the rate entered above
                  </Typography>
                </Paper>
              </Box>

              {/* 3. ELECTRICITY BILL */}

              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 700 }}
              >
                3. Electricity Bill
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: "action.hover",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Bill Value
                  </Typography>

                 <Typography
  variant="h5"
  sx={{ mt: 1, fontWeight: 600 }}
>
                    {calculatedBillValue === null
                      ? "—"
                      : formatMoney(calculatedBillValue)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Automatically calculated
                  </Typography>
                </Paper>

                <TextField
                  label="Balance Bill (Rs.)"
                  type="number"
                  required
                  value={form.balance_bill}
                  onChange={(event) =>
                    handleChange(
                      "balance_bill",
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                  }}
                  helperText="Enter the balance bill amount."
                  fullWidth
                />

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: "action.hover",
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Bill
                  </Typography>

                  <Typography
                    variant="h4"
                    sx={{ mt: 1, fontWeight: 600 }}
                  >
                    {calculatedTotalBill === null
                      ? "—"
                      : formatMoney(calculatedTotalBill)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Bill Value + Balance Bill
                  </Typography>
                </Paper>
              </Box>

              {/* 4. PERFORMANCE */}

             <Typography
  variant="subtitle1"
  sx={{ mt: 1, mb: 1, fontWeight: 600 }}
>
                4. Generation Performance
              </Typography>

              <Paper
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 2 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Actual Generation Performance
                </Typography>

                <Typography
                        variant="h5"
                        sx={{ mt: 1, fontWeight: 600 }}
                      >
                  {performance === null
                    ? "—"
                    : `${formatNumber(performance)}%`}
                </Typography>

                {performance !== null && (
                  <Chip
                    size="small"
                    sx={{ mt: 1 }}
                    color={
                      performance >= 100
                        ? "success"
                        : "warning"
                    }
                    label={
                      performance >= 100
                        ? "Target Achieved"
                        : "Below Expected"
                    }
                  />
                )}
              </Paper>

              {/* 5. REMARKS */}

             <Typography
                  variant="subtitle1"
                  sx={{ mt: 1, mb: 1, fontWeight: 600 }}
                >
                5. Remarks
              </Typography>

              <TextField
                label="Remarks"
                multiline
                minRows={2}
                value={form.remarks}
                onChange={(event) =>
                  handleChange(
                    "remarks",
                    event.target.value
                  )
                }
                fullWidth
              />

              {/* FORMULA INFORMATION */}

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                  Calculation Formula
                </Typography>

                <Typography variant="body2">
                  Bill Value = (Actual Generation − Export Units
                  + Import Units) × Import Rate
                </Typography>

                <Typography variant="body2">
                  Total Bill = Bill Value + Balance Bill
                </Typography>

                The Bill Value and Total Bill are calculated
                automatically by the backend when the record
                is saved.
              </Alert>

              {/* SAVE BUTTON */}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 3,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : editingRecord ? (
                      <EditIcon />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={() => void handleSave()}
                  disabled={
                    saving ||
                    loadingSites ||
                    !selectedSite ||
                    loadingSelectedMonth
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Update Monthly Record"
                      : "Save Monthly Record"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* MONTHLY HISTORY */}

      <Card
        variant="outlined"
        sx={{ borderRadius: 2 }}
      >
        <CardContent
          sx={{ p: { xs: 2, sm: 3 } }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              gap: 1,
            }}
          >
            <Box>
             <Typography
  variant="body2"
  sx={{ fontWeight: 600 }}
>
                Monthly Solar History
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedSiteDetails?.name || "Select a site"} –{" "}
                {selectedYear}
              </Typography>
            </Box>

            <Chip
              label={`${records.length} Records`}
              variant="outlined"
            />
          </Box>

          {loadingRecords ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : records.length === 0 ? (
            <Alert severity="info">
              No monthly solar records found for this site and year.
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
            >
              <Table
                size="small"
                sx={{ minWidth: 1250 }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Month</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Expected (kWh)</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Actual (kWh)</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Performance</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Import Units</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Export Units</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Import Rate</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Bill Value</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Balance Bill</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Total Bill</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Mode</strong>
                    </TableCell>

                    <TableCell align="center">
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.map((record) => {
                    const recordPerformance =
                      record.performance_percentage === null ||
                      record.performance_percentage === undefined
                        ? null
                        : Number(
                            record.performance_percentage
                          );

                    return (
                      <TableRow
                        key={record.id}
                        hover
                      >
                        <TableCell>
                         <Typography
  variant="body2"
  sx={{ fontWeight: 600 }}
>
                            {MONTHS[record.month - 1]}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            record.expected_generation_kwh
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            record.actual_generation_kwh
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {recordPerformance === null
                            ? "—"
                            : `${formatNumber(
                                recordPerformance
                              )}%`}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            record.actual_import_units
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(
                            record.actual_export_units
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {formatMoney(record.import_rate)}
                        </TableCell>

                        <TableCell align="right">
                          {formatMoney(record.bill_value)}
                        </TableCell>

                        <TableCell align="right">
                          {formatMoney(record.balance_bill)}
                        </TableCell>

                        <TableCell align="right">
                         <Typography
  variant="body2"
  sx={{ fontWeight: 700 }}
>
                            {formatMoney(record.total_bill)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={record.entry_mode}
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() =>
                              handleEditRecord(record)
                            }
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* SUCCESS MESSAGE */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={successMessage}
      />
    </Box>
  );
};

export default MonthlySolarEntry;