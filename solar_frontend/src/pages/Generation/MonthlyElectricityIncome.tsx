
import React, { useCallback, useEffect, useMemo, useState } from "react";

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
import DeleteIcon from "@mui/icons-material/Delete";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import api from "../../api/axios";

// --------------------------------------------------
// Types
// --------------------------------------------------

interface SiteOption {
  id: number;
  name: string;
  asset_code?: string;
}

interface IncomeRecord {
  id: number;
  site: number;
  site_name?: string;
  year: number;
  month: number;
  income_amount: string | number;
  remarks?: string;
  entered_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface IncomeForm {
  income_amount: string;
  remarks: string;
}

// --------------------------------------------------
// Constants
// --------------------------------------------------

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentDate = new Date();

const emptyForm = (): IncomeForm => ({
  income_amount: "",
  remarks: "",
});

// --------------------------------------------------
// Helper Functions
// --------------------------------------------------

const unwrapArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatMoney = (value: number | string): string => {
  return `Rs. ${formatNumber(Number(value) || 0)}`;
};

const getApiErrorMessage = (error: any): string => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.income_amount) {
    return Array.isArray(data.income_amount)
      ? data.income_amount[0]
      : data.income_amount;
  }

  if (data?.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors[0]
      : data.non_field_errors;
  }

  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];

    if (firstKey) {
      const value = data[firstKey];
      return Array.isArray(value) ? value[0] : String(value);
    }
  }

  return error?.message || "Something went wrong. Please try again.";
};

// --------------------------------------------------
// Main Component
// --------------------------------------------------

const MonthlyElectricityIncome: React.FC = () => {
  // ------------------------------------------------
  // State
  // ------------------------------------------------

  const [sites, setSites] = useState<SiteOption[]>([]);
  const [records, setRecords] = useState<IncomeRecord[]>([]);

  const [selectedSite, setSelectedSite] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1
  );

  const [form, setForm] = useState<IncomeForm>(emptyForm());
  const [editingRecord, setEditingRecord] =
    useState<IncomeRecord | null>(null);

  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // ------------------------------------------------
  // Year Options
  // ------------------------------------------------

  const years = useMemo(() => {
    const startYear = 2023;
    const endYear = currentDate.getFullYear() + 1;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => endYear - index
    );
  }, []);

  // ------------------------------------------------
  // Load Sites
  // ------------------------------------------------

  const loadSites = useCallback(async () => {
    try {
      setLoadingSites(true);
      setErrorMessage("");

      const response = await api.get("/sites/");
      const siteList = unwrapArray<SiteOption>(response.data);

      setSites(siteList);

      setSelectedSite((previous) => {
        if (
          previous !== "" &&
          siteList.some((site) => site.id === previous)
        ) {
          return previous;
        }

        return siteList.length > 0 ? siteList[0].id : "";
      });
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoadingSites(false);
    }
  }, []);

  // ------------------------------------------------
  // Load Yearly Records
  // ------------------------------------------------

  const loadRecords = useCallback(async () => {
    if (!selectedSite) {
      setRecords([]);
      return;
    }

    try {
      setLoadingRecords(true);

      const response = await api.get("/monthly-electricity-incomes/", {
        params: {
          site: selectedSite,
          year: selectedYear,
        },
      });

      const recordList = unwrapArray<IncomeRecord>(response.data);

      setRecords(
        recordList.sort((a, b) => a.month - b.month)
      );
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedSite, selectedYear]);

  // ------------------------------------------------
  // Load Selected Month
  // ------------------------------------------------

  const loadSelectedMonth = useCallback(async () => {
    if (!selectedSite) {
      setForm(emptyForm());
      setEditingRecord(null);
      return;
    }

    try {
      setLoadingMonth(true);

      const response = await api.get("/monthly-electricity-incomes/", {
        params: {
          site: selectedSite,
          year: selectedYear,
          month: selectedMonth,
        },
      });

      const monthRecords = unwrapArray<IncomeRecord>(response.data);

      const existingRecord = monthRecords.find(
        (record) =>
          record.site === selectedSite &&
          record.year === selectedYear &&
          record.month === selectedMonth
      );

      if (existingRecord) {
        setEditingRecord(existingRecord);

        setForm({
          income_amount: String(existingRecord.income_amount ?? ""),
          remarks: existingRecord.remarks ?? "",
        });
      } else {
        setEditingRecord(null);
        setForm(emptyForm());
      }
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoadingMonth(false);
    }
  }, [selectedSite, selectedYear, selectedMonth]);

  // ------------------------------------------------
  // Initial Load
  // ------------------------------------------------

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (selectedSite !== "") {
      loadRecords();
    } else {
      setRecords([]);
    }
  }, [selectedSite, selectedYear, loadRecords]);

  useEffect(() => {
    if (selectedSite !== "") {
      loadSelectedMonth();
    } else {
      setForm(emptyForm());
      setEditingRecord(null);
    }
  }, [selectedSite, selectedYear, selectedMonth, loadSelectedMonth]);

  // ------------------------------------------------
  // Form Change
  // ------------------------------------------------

  const handleFormChange = (
    field: keyof IncomeForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ------------------------------------------------
  // Save Income
  // ------------------------------------------------

  const handleSave = async () => {
    if (selectedSite === "") {
      setErrorMessage("Please select a site.");
      return;
    }

    if (!form.income_amount.trim()) {
      setErrorMessage("Please enter the electricity income amount.");
      return;
    }

    const amount = Number(form.income_amount);

    if (!Number.isFinite(amount) || amount < 0) {
      setErrorMessage("Please enter a valid income amount.");
      return;
    }

    const payload = {
      site: selectedSite,
      year: selectedYear,
      month: selectedMonth,
      income_amount: amount,
      remarks: form.remarks,
    };

    try {
      setSaving(true);
      setErrorMessage("");

      if (editingRecord) {
        await api.patch(
          `/monthly-electricity-incomes/${editingRecord.id}/`,
          payload
        );

        setSuccessMessage(
          "Monthly electricity income updated successfully."
        );
      } else {
        await api.post("/monthly-electricity-incomes/", payload);

        setSuccessMessage(
          "Monthly electricity income saved successfully."
        );
      }

      setSnackbarOpen(true);

      await loadRecords();
      await loadSelectedMonth();
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------
  // Edit Record
  // ------------------------------------------------

  const handleEdit = (record: IncomeRecord) => {
    setSelectedMonth(record.month);
    setEditingRecord(record);

    setForm({
      income_amount: String(record.income_amount ?? ""),
      remarks: record.remarks ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ------------------------------------------------
  // Delete Record
  // ------------------------------------------------

  const handleDelete = async (record: IncomeRecord) => {
    const monthName = MONTHS.find(
      (month) => month.value === record.month
    )?.label;

    const confirmed = window.confirm(
      `Are you sure you want to delete the income record for ${monthName} ${record.year}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      await api.delete(
        `/monthly-electricity-incomes/${record.id}/`
      );

      setSuccessMessage("Income record deleted successfully.");
      setSnackbarOpen(true);

      if (editingRecord?.id === record.id) {
        setEditingRecord(null);
        setForm(emptyForm());
      }

      await loadRecords();

      if (
        selectedMonth === record.month &&
        selectedYear === record.year
      ) {
        await loadSelectedMonth();
      }
    } catch (error: any) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  // ------------------------------------------------
  // New Entry / Refresh
  // ------------------------------------------------

  const handleNewEntry = () => {
    setEditingRecord(null);
    setForm(emptyForm());
  };

  const handleRefresh = async () => {
    await loadSites();
    await loadRecords();
    await loadSelectedMonth();
  };

  // ------------------------------------------------
  // Summary Calculations
  // ------------------------------------------------

  const totalIncome = useMemo(() => {
    return records.reduce(
      (total, record) =>
        total + (Number(record.income_amount) || 0),
      0
    );
  }, [records]);

  const recordedMonths = records.length;

  const averageIncome = recordedMonths
    ? totalIncome / recordedMonths
    : 0;

  const selectedSiteName = sites.find(
    (site) => site.id === selectedSite
  )?.name;

  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <Box sx={{ p: 2 }}>
      {/* Page Header */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700 }}
          >
            Monthly Electricity Income
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Record and monitor actual monthly income received from the Electricity Board.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewEntry}
          >
            New Entry
          </Button>
        </Box>
      </Box>

      {/* Error Message */}

      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setErrorMessage("")}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Filters */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Select Site and Period
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
            <FormControl fullWidth size="small">
              <InputLabel>Solar Site</InputLabel>

              <Select
                value={selectedSite}
                label="Solar Site"
                onChange={(event) => {
                  setSelectedSite(Number(event.target.value));
                }}
                disabled={loadingSites}
              >
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                    {site.asset_code ? ` (${site.asset_code})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>

              <Select
                value={selectedYear}
                label="Year"
                onChange={(event) =>
                  setSelectedYear(Number(event.target.value))
                }
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>

              <Select
                value={selectedMonth}
                label="Month"
                onChange={(event) =>
                  setSelectedMonth(Number(event.target.value))
                }
              >
                {MONTHS.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Total Income - {selectedYear}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  {formatMoney(totalIncome)}
                </Typography>
              </Box>

              <PaymentsIcon
                color="primary"
                sx={{ fontSize: 38 }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Recorded Months
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  {recordedMonths} / 12
                </Typography>
              </Box>

              <ReceiptLongIcon
                color="success"
                sx={{ fontSize: 38 }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Average Monthly Income
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  {formatMoney(averageIncome)}
                </Typography>
              </Box>

              <TrendingUpIcon
                color="warning"
                sx={{ fontSize: 38 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Income Entry Form */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                {editingRecord ? "Update Income Entry" : "Add Monthly Income"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedSiteName || "Select a site"} -{" "}
                {MONTHS.find(
                  (month) => month.value === selectedMonth
                )?.label}{" "}
                {selectedYear}
              </Typography>
            </Box>

            {editingRecord && (
              <Chip
                label="Editing Existing Record"
                color="warning"
                size="small"
              />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loadingMonth ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 3,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 2fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Electricity Income (Rs.)"
                  type="number"
                  value={form.income_amount}
                  onChange={(event) =>
                    handleFormChange(
                      "income_amount",
                      event.target.value
                    )
                  }
                  placeholder="Enter amount"
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "0.01",
                    },
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Remarks"
                  value={form.remarks}
                  onChange={(event) =>
                    handleFormChange("remarks", event.target.value)
                  }
                  placeholder="Optional remarks"
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 3,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleNewEntry}
                  disabled={saving}
                >
                  Clear
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={handleSave}
                  disabled={saving || selectedSite === ""}
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                    ? "Update Income"
                    : "Save Income"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Yearly Income History */}

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Monthly Income History
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedSiteName || "Selected Site"} - {selectedYear}
              </Typography>
            </Box>

            <Chip
              label={`${recordedMonths} Records`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loadingRecords ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Month
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      Income (Rs.)
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Remarks
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Entered By
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 3 }}
                        >
                          No electricity income records found for this year.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow
                        key={record.id}
                        hover
                        selected={editingRecord?.id === record.id}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {
                              MONTHS.find(
                                (month) => month.value === record.month
                              )?.label
                            }
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {formatNumber(
                              Number(record.income_amount) || 0
                            )}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {record.remarks || "-"}
                        </TableCell>

                        <TableCell>
                          {record.entered_by_name || "-"}
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 0.5,
                            }}
                          >
                            <Button
                              size="small"
                              color="primary"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(record)}
                            >
                              Edit
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDelete(record)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {records.length > 0 && (
                    <TableRow
                      sx={{ backgroundColor: "action.hover" }}
                    >
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          Total
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {formatNumber(totalIncome)}
                        </Typography>
                      </TableCell>

                      <TableCell colSpan={3} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Success Snackbar */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonthlyElectricityIncome;
