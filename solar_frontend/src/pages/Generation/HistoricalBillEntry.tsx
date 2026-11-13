
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

import api from "../../api/axios_local";
import { getSites } from "../../api/sites";

// ======================================================
// TYPES
// ======================================================

interface Site {
  id: number;
  name: string;
}

interface HistoricalBillEntry {
  id: number;
  site: number;
  site_name: string;
  year: number;
  bill_value: string;
  remarks: string | null;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  site: string;
  year: string;
  bill_value: string;
  remarks: string;
}

// ======================================================
// CONSTANTS
// ======================================================

const API_URL = "/historical-bill-entries/";
const currentYear = new Date().getFullYear();

const emptyForm: FormData = {
  site: "",
  year: String(currentYear - 1),
  bill_value: "",
  remarks: "",
};

// ======================================================
// HELPERS
// ======================================================

const formatMoney = (value: string | number) => {
  return Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const extractArray = (response: any): any[] => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getErrorMessage = (error: any): string => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.year) {
    return Array.isArray(data.year)
      ? data.year.join(", ")
      : String(data.year);
  }

  if (data?.bill_value) {
    return Array.isArray(data.bill_value)
      ? data.bill_value.join(", ")
      : String(data.bill_value);
  }

  if (data?.site) {
    return Array.isArray(data.site)
      ? data.site.join(", ")
      : String(data.site);
  }

  if (data?.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors.join(", ")
      : String(data.non_field_errors);
  }

  return "Something went wrong. Please try again.";
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function HistoricalBillEntry() {
  const [sites, setSites] = useState<Site[]>([]);
  const [records, setRecords] = useState<HistoricalBillEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedSite, setSelectedSite] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ====================================================
  // LOAD SITES
  // ====================================================

  const loadSites = useCallback(async () => {
    try {
      const response = await getSites();
      const data = extractArray(response);

      setSites(
        data.map((site: any) => ({
          id: Number(site.id),
          name:
            site.name ??
            site.site_name ??
            site.asset_code ??
            `Site ${site.id}`,
        }))
      );
    } catch (err) {
      console.error("Failed to load sites:", err);
      setError("Unable to load solar sites.");
    }
  }, []);

  // ====================================================
  // LOAD HISTORICAL RECORDS
  // ====================================================

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string> = {};

      if (selectedSite) {
        params.site = selectedSite;
      }

      if (selectedYear) {
        params.year = selectedYear;
      }

      const response = await api.get(API_URL, { params });

      setRecords(extractArray(response));
      setPage(0);
    } catch (err) {
      console.error("Failed to load historical bills:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedSite, selectedYear]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // ====================================================
  // OPEN ADD DIALOG
  // ====================================================

  const handleAdd = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      site: selectedSite || "",
      year: selectedYear || String(currentYear - 1),
    });

    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  // ====================================================
  // OPEN EDIT DIALOG
  // ====================================================

  const handleEdit = (record: HistoricalBillEntry) => {
    setEditingId(record.id);

    setForm({
      site: String(record.site),
      year: String(record.year),
      bill_value: String(record.bill_value),
      remarks: record.remarks || "",
    });

    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ====================================================
  // SAVE / UPDATE
  // ====================================================

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!form.site) {
      setError("Please select a solar site.");
      return;
    }

    const year = Number(form.year);
    const billValue = Number(form.bill_value);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      setError("Please enter a valid year between 2000 and 2100.");
      return;
    }

    if (
      form.bill_value.trim() === "" ||
      !Number.isFinite(billValue) ||
      billValue < 0
    ) {
      setError("Please enter a valid non-negative bill value.");
      return;
    }

    const payload = {
      site: Number(form.site),
      year,
      bill_value: billValue.toFixed(2),
      remarks: form.remarks,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await api.put(`${API_URL}${editingId}/`, payload);
        setSuccess("Historical bill entry updated successfully.");
      } else {
        await api.post(API_URL, payload);
        setSuccess("Historical bill entry saved successfully.");
      }

      setDialogOpen(false);
      setEditingId(null);

      await loadRecords();
    } catch (err) {
      console.error("Failed to save historical bill:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this historical bill entry?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`${API_URL}${id}/`);

      setSuccess("Historical bill entry deleted successfully.");

      await loadRecords();
    } catch (err) {
      console.error("Failed to delete historical bill:", err);
      setError(getErrorMessage(err));
    }
  };

  // ====================================================
  // SUMMARY
  // ====================================================

  const totalBillValue = records.reduce(
    (total, record) =>
      total + Number(record.bill_value || 0),
    0
  );

  const paginatedRecords = records.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ====================================================
  // UI
  // ====================================================

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* PAGE HEADER */}

      <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{
    mb: 3,
    justifyContent: "space-between",
    alignItems: {
      xs: "stretch",
      sm: "center",
    },
  }}
>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Historical Bill Value Entry
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Enter annual solar bill history before SolarHub implementation.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRecords}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Historical Bill
          </Button>
        </Stack>
      </Stack>

      {/* ALERTS */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* SUMMARY */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{ justifyContent: "space-between" }}
>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Total Historical Bill Value
              </Typography>

              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                Rs. {formatMoney(totalBillValue)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Based on the currently filtered records
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="body2">
                Historical Entries
              </Typography>

              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                {records.length}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* FILTERS */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Filter Historical Records
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <TextField
              select
              label="Solar Site"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              fullWidth
            >
              <MenuItem value="">All Sites</MenuItem>

              {sites.map((site) => (
                <MenuItem key={site.id} value={String(site.id)}>
                  {site.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Year"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              fullWidth
              slotProps={{
                htmlInput: {
                  min: 2000,
                  max: 2100,
                },
              }}
            />

            <Button
              variant="outlined"
              onClick={() => {
                setSelectedSite("");
                setSelectedYear("");
              }}
            >
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* RECORDS TABLE */}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Historical Bill Records
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Site</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Year</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Bill Value (Rs.)</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Remarks</strong>
                      </TableCell>

                      <TableCell align="center">
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography
                            color="text.secondary"
                            sx={{ py: 4 }}
                          >
                            No historical bill records found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecords.map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell>
                            {record.site_name || `Site ${record.site}`}
                          </TableCell>

                          <TableCell>{record.year}</TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600 }}>
                              {formatMoney(record.bill_value)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {record.remarks || "-"}
                          </TableCell>

                          <TableCell align="center">
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(record)}
                              title="Edit"
                            >
                              <EditOutlinedIcon />
                            </IconButton>

                            <IconButton
                              color="error"
                              onClick={() => handleDelete(record.id)}
                              title="Delete"
                            >
                              {/* Corrected icon */}
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={records.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId !== null
            ? "Edit Historical Bill Entry"
            : "Add Historical Bill Entry"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 2 }}>

            <TextField
              select
              label="Solar Site"
              value={form.site}
              onChange={(e) => handleChange("site", e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="">
                Select Solar Site
              </MenuItem>

              {sites.map((site) => (
                <MenuItem key={site.id} value={String(site.id)}>
                  {site.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Year"
              type="number"
              value={form.year}
              onChange={(e) => handleChange("year", e.target.value)}
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  min: 2000,
                  max: 2100,
                },
              }}
            />

            <TextField
              label="Annual Bill Value (Rs.)"
              type="number"
              value={form.bill_value}
              onChange={(e) => handleChange("bill_value", e.target.value)}
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: "0.01",
                },
              }}
            />

            <TextField
              label="Remarks"
              value={form.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter any additional information..."
            />

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={18} /> : undefined
            }
          >
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update"
                : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
