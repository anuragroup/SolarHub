
import { useCallback, useEffect, useState } from "react";
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

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import api from "../../api/axios";

import {
  getMaintenanceSchedules,
  getBreakdowns,
  createMaintenanceSchedule,
  updateMaintenanceSchedule,
  createBreakdown,
  updateBreakdown,
  type MaintenanceSchedule,
  type Breakdown,
  type SiteOption,
  type CreateMaintenanceSchedule,
  type CreateBreakdown,
  type MaintenanceType,
  type MaintenanceStatus,
  type BreakdownPriority,
  type BreakdownStatus,
} from "../../api/maintenance";

// ==========================================================
// FORM TYPES
// ==========================================================

interface ScheduleForm {
  site: number | "";
  title: string;
  maintenance_type: MaintenanceType;
  scheduled_date: string;
  status: MaintenanceStatus;
  description: string;
  work_performed: string;
  completed_date: string;
  remarks: string;
}

interface BreakdownForm {
  site: number | "";
  title: string;
  equipment_name: string;
  breakdown_date: string;
  priority: BreakdownPriority;
  status: BreakdownStatus;
  problem_description: string;
  root_cause: string;
  corrective_action: string;
  remarks: string;
}

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialScheduleForm = (): ScheduleForm => ({
  site: "",
  title: "",
  maintenance_type: "PREVENTIVE",
  scheduled_date: today(),
  status: "SCHEDULED",
  description: "",
  work_performed: "",
  completed_date: "",
  remarks: "",
});

const initialBreakdownForm = (): BreakdownForm => ({
  site: "",
  title: "",
  equipment_name: "",
  breakdown_date: new Date().toISOString().slice(0, 16),
  priority: "MEDIUM",
  status: "OPEN",
  problem_description: "",
  root_cause: "",
  corrective_action: "",
  remarks: "",
});

function errorMessage(error: unknown): string {
  const err = error as {
    response?: {
      data?: Record<string, unknown> | string;
    };
    message?: string;
  };

  const data = err?.response?.data;

  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${key}: ${message}`;
      })
      .join(" | ");
  }

  return err?.message || "An unexpected error occurred.";
}

function statusColor(
  status: string,
): "default" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case "COMPLETED":
    case "RESOLVED":
    case "CLOSED":
      return "success";
    case "IN_PROGRESS":
    case "INVESTIGATING":
      return "info";
    case "CANCELLED":
      return "default";
    case "CRITICAL":
    case "HIGH":
    case "OPEN":
      return "error";
    case "SCHEDULED":
    case "MEDIUM":
      return "warning";
    default:
      return "default";
  }
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

// ==========================================================
// MAIN PAGE
// ==========================================================

export default function MaintenancePage() {
  const [tab, setTab] = useState(0);

  const [sites, setSites] = useState<SiteOption[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [breakdownDialog, setBreakdownDialog] = useState(false);

  const [editingSchedule, setEditingSchedule] =
    useState<MaintenanceSchedule | null>(null);

  const [editingBreakdown, setEditingBreakdown] =
    useState<Breakdown | null>(null);

  const [scheduleForm, setScheduleForm] =
    useState<ScheduleForm>(initialScheduleForm);

  const [breakdownForm, setBreakdownForm] =
    useState<BreakdownForm>(initialBreakdownForm);

  const [scheduleFilter, setScheduleFilter] = useState("ALL");
  const [breakdownStatusFilter, setBreakdownStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // ========================================================
  // LOAD DATA
  // ========================================================

  const loadSites = useCallback(async () => {
    const response = await api.get("/sites/");
    const data = response.data;

    const siteList: SiteOption[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];

    setSites(siteList);
  }, []);

  const loadSchedules = useCallback(async () => {
    const data = await getMaintenanceSchedules();
    setSchedules(data);
  }, []);

  const loadBreakdownRecords = useCallback(async () => {
    const data = await getBreakdowns();
    setBreakdowns(data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      await Promise.all([
        loadSites(),
        loadSchedules(),
        loadBreakdownRecords(),
      ]);
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [loadSites, loadSchedules, loadBreakdownRecords]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ========================================================
  // NOTIFICATIONS
  // ========================================================

  const notify = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // ========================================================
  // SCHEDULE FORM
  // ========================================================

  const openNewSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm(initialScheduleForm());
    setFormError("");
    setScheduleDialog(true);
  };

  const openEditSchedule = (item: MaintenanceSchedule) => {
    setEditingSchedule(item);

    setScheduleForm({
      site: item.site,
      title: item.title,
      maintenance_type: item.maintenance_type,
      scheduled_date: item.scheduled_date,
      status: item.status,
      description: item.description || "",
      work_performed: item.work_performed || "",
      completed_date: item.completed_date || "",
      remarks: item.remarks || "",
    });

    setFormError("");
    setScheduleDialog(true);
  };

  const saveSchedule = async () => {
    setFormError("");

    if (!scheduleForm.site || !scheduleForm.title.trim()) {
      setFormError("Please select a site and enter a maintenance title.");
      return;
    }

    if (!scheduleForm.scheduled_date) {
      setFormError("Please select a scheduled date.");
      return;
    }

    if (
      scheduleForm.status === "COMPLETED" &&
      !scheduleForm.completed_date
    ) {
      setFormError("Please enter the completed date.");
      return;
    }

    const payload: CreateMaintenanceSchedule = {
      site: Number(scheduleForm.site),
      title: scheduleForm.title.trim(),
      maintenance_type: scheduleForm.maintenance_type,
      scheduled_date: scheduleForm.scheduled_date,
      status: scheduleForm.status,
      description: scheduleForm.description,
      work_performed: scheduleForm.work_performed,
      completed_date: scheduleForm.completed_date || null,
      remarks: scheduleForm.remarks,
    };

    setSaving(true);

    try {
      if (editingSchedule) {
        await updateMaintenanceSchedule(editingSchedule.id, payload);
        notify("Maintenance schedule updated successfully.");
      } else {
        await createMaintenanceSchedule(payload);
        notify("Maintenance schedule created successfully.");
      }

      setScheduleDialog(false);
      await Promise.all([loadSchedules(), loadBreakdownRecords()]);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // BREAKDOWN FORM
  // ========================================================

  const openNewBreakdown = () => {
    setEditingBreakdown(null);
    setBreakdownForm(initialBreakdownForm());
    setFormError("");
    setBreakdownDialog(true);
  };

  const openEditBreakdown = (item: Breakdown) => {
    setEditingBreakdown(item);

    setBreakdownForm({
      site: item.site,
      title: item.title,
      equipment_name: item.equipment_name || "",
      breakdown_date: item.breakdown_date
        ? item.breakdown_date.slice(0, 16)
        : "",
      priority: item.priority,
      status: item.status,
      problem_description: item.problem_description || "",
      root_cause: item.root_cause || "",
      corrective_action: item.corrective_action || "",
      remarks: item.remarks || "",
    });

    setFormError("");
    setBreakdownDialog(true);
  };

  const saveBreakdown = async () => {
    setFormError("");

    if (
      !breakdownForm.site ||
      !breakdownForm.title.trim() ||
      !breakdownForm.breakdown_date ||
      !breakdownForm.problem_description.trim()
    ) {
      setFormError(
        "Please complete the site, title, breakdown date and problem description.",
      );
      return;
    }

    const payload: CreateBreakdown = {
      site: Number(breakdownForm.site),
      title: breakdownForm.title.trim(),
      equipment_name: breakdownForm.equipment_name,
      breakdown_date: breakdownForm.breakdown_date,
      priority: breakdownForm.priority,
      status: breakdownForm.status,
      problem_description: breakdownForm.problem_description.trim(),
      root_cause: breakdownForm.root_cause,
      corrective_action: breakdownForm.corrective_action,
      remarks: breakdownForm.remarks,
    };

    setSaving(true);

    try {
      if (editingBreakdown) {
        await updateBreakdown(editingBreakdown.id, payload);
        notify("Breakdown updated successfully.");
      } else {
        await createBreakdown(payload);
        notify("Breakdown recorded successfully.");
      }

      setBreakdownDialog(false);
      await Promise.all([loadBreakdownRecords(), loadSchedules()]);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // FILTERS
  // ========================================================

  const filteredSchedules = schedules.filter((item) => {
    const matchesStatus =
      scheduleFilter === "ALL" || item.status === scheduleFilter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      !searchText ||
      item.title.toLowerCase().includes(searchText) ||
      item.site_name.toLowerCase().includes(searchText) ||
      item.site_asset_code.toLowerCase().includes(searchText);

    return matchesStatus && matchesSearch;
  });

  const filteredBreakdowns = breakdowns.filter((item) => {
    const matchesStatus =
      breakdownStatusFilter === "ALL" ||
      item.status === breakdownStatusFilter;

    const matchesPriority =
      priorityFilter === "ALL" || item.priority === priorityFilter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      !searchText ||
      item.title.toLowerCase().includes(searchText) ||
      item.site_name.toLowerCase().includes(searchText) ||
      item.site_asset_code.toLowerCase().includes(searchText) ||
      item.equipment_name.toLowerCase().includes(searchText);

    return matchesStatus && matchesPriority && matchesSearch;
  });

  // ========================================================
  // SUMMARY COUNTS
  // ========================================================

  const upcomingCount = schedules.filter(
    (item) =>
      item.status === "SCHEDULED" && item.scheduled_date >= today(),
  ).length;

  const overdueCount = schedules.filter(
    (item) =>
      item.status === "SCHEDULED" && item.scheduled_date < today(),
  ).length;

  const openBreakdownCount = breakdowns.filter(
    (item) => !["RESOLVED", "CLOSED"].includes(item.status),
  ).length;

  const completedCount = schedules.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Maintenance Management
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Plan maintenance and track solar equipment breakdowns.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadAll()}
            disabled={loading}
          >
            Refresh
          </Button>

          {tab === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNewSchedule}
            >
              Add Maintenance
            </Button>
          )}

          {tab === 1 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<AddIcon />}
              onClick={openNewBreakdown}
            >
              Report Breakdown
            </Button>
          )}
        </Stack>
      </Stack>

      {pageError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={() => void loadAll()}>
              Retry
            </Button>
          }
        >
          {pageError}
        </Alert>
      )}

      {/* SUMMARY CARDS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <BuildIcon color="primary" />
              <Typography color="text.secondary" variant="body2">
                Upcoming
              </Typography>
            </Stack>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {upcomingCount}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Overdue Maintenance
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color={overdueCount ? "error.main" : "text.primary"}
              sx={{ mt: 1 }}
            >
              {overdueCount}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon color="error" />
              <Typography color="text.secondary" variant="body2">
                Open Breakdowns
              </Typography>
            </Stack>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              {openBreakdownCount}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Completed Maintenance
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              {completedCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* TABS */}

      <Paper variant="outlined">
        <Tabs
          value={tab}
          onChange={(_, value: number) => {
            setTab(value);
            setSearch("");
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Maintenance Schedule" />
          <Tab label="Breakdown Tracking" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Search"
              size="small"
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, site or equipment"
            />

            {tab === 0 ? (
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel id="schedule-status-label">
                  Status
                </InputLabel>
                <Select
                  labelId="schedule-status-label"
                  label="Status"
                  value={scheduleFilter}
                  onChange={(event) => setScheduleFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All statuses</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="breakdown-status-label">
                    Status
                  </InputLabel>
                  <Select
                    labelId="breakdown-status-label"
                    label="Status"
                    value={breakdownStatusFilter}
                    onChange={(event) =>
                      setBreakdownStatusFilter(event.target.value)
                    }
                  >
                    <MenuItem value="ALL">All statuses</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="INVESTIGATING">
                      Investigating
                    </MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="breakdown-priority-label">
                    Priority
                  </InputLabel>
                  <Select
                    labelId="breakdown-priority-label"
                    label="Priority"
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value)}
                  >
                    <MenuItem value="ALL">All priorities</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : tab === 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredSchedules.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.site_asset_code}
                        </Typography>
                      </TableCell>

                      <TableCell>{item.site_name}</TableCell>
                      <TableCell>
                        {formatLabel(item.maintenance_type)}
                      </TableCell>
                      <TableCell>{item.scheduled_date}</TableCell>
                      <TableCell>
                        {item.assigned_to_name || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={formatLabel(item.status)}
                          color={statusColor(item.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => openEditSchedule(item)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          No maintenance schedules found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Breakdown</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Equipment</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredBreakdowns.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {item.site_asset_code}
                        </Typography>
                      </TableCell>

                      <TableCell>{item.site_name}</TableCell>
                      <TableCell>
                        {item.equipment_name || "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(item.breakdown_date).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.priority}
                          color={statusColor(item.priority)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={formatLabel(item.status)}
                          color={statusColor(item.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => openEditBreakdown(item)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredBreakdowns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          No breakdown records found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* MAINTENANCE DIALOG */}

      <Dialog
        open={scheduleDialog}
        onClose={() => !saving && setScheduleDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingSchedule ? "Edit Maintenance" : "Add Maintenance Schedule"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <FormControl fullWidth required>
              <InputLabel id="maintenance-site-label">Site</InputLabel>
              <Select
                labelId="maintenance-site-label"
                label="Site"
                value={scheduleForm.site}
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    site: event.target.value as number | "",
                  }))
                }
              >
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name} ({site.asset_code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Maintenance Title"
              required
              fullWidth
              value={scheduleForm.title}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="maintenance-type-label">
                  Maintenance Type
                </InputLabel>
                <Select
                  labelId="maintenance-type-label"
                  label="Maintenance Type"
                  value={scheduleForm.maintenance_type}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      maintenance_type: event.target.value as MaintenanceType,
                    }))
                  }
                >
                  <MenuItem value="PREVENTIVE">Preventive</MenuItem>
                  <MenuItem value="CORRECTIVE">Corrective</MenuItem>
                  <MenuItem value="INSPECTION">Inspection</MenuItem>
                  <MenuItem value="CLEANING">Panel Cleaning</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Scheduled Date"
                type="date"
                fullWidth
                required
                value={scheduleForm.scheduled_date}
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    scheduled_date: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="maintenance-status-label">Status</InputLabel>
              <Select
                labelId="maintenance-status-label"
                label="Status"
                value={scheduleForm.status}
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    status: event.target.value as MaintenanceStatus,
                  }))
                }
              >
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>

            {scheduleForm.status === "COMPLETED" && (
              <TextField
                label="Completed Date"
                type="date"
                fullWidth
                value={scheduleForm.completed_date}
                onChange={(event) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    completed_date: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

            <TextField
              label="Description"
              multiline
              minRows={2}
              fullWidth
              value={scheduleForm.description}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />

            <TextField
              label="Work Performed"
              multiline
              minRows={2}
              fullWidth
              value={scheduleForm.work_performed}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  work_performed: event.target.value,
                }))
              }
            />

            <TextField
              label="Remarks"
              multiline
              minRows={2}
              fullWidth
              value={scheduleForm.remarks}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  remarks: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setScheduleDialog(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => void saveSchedule()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Maintenance"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BREAKDOWN DIALOG */}

      <Dialog
        open={breakdownDialog}
        onClose={() => !saving && setBreakdownDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingBreakdown ? "Edit Breakdown" : "Report Breakdown"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <FormControl fullWidth required>
              <InputLabel id="breakdown-site-label">Site</InputLabel>
              <Select
                labelId="breakdown-site-label"
                label="Site"
                value={breakdownForm.site}
                onChange={(event) =>
                  setBreakdownForm((prev) => ({
                    ...prev,
                    site: event.target.value as number | "",
                  }))
                }
              >
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name} ({site.asset_code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Breakdown Title"
              required
              fullWidth
              value={breakdownForm.title}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />

            <TextField
              label="Equipment Name"
              fullWidth
              value={breakdownForm.equipment_name}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  equipment_name: event.target.value,
                }))
              }
            />

            <TextField
              label="Breakdown Date and Time"
              type="datetime-local"
              required
              fullWidth
              value={breakdownForm.breakdown_date}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  breakdown_date: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="breakdown-priority-form-label">
                  Priority
                </InputLabel>
                <Select
                  labelId="breakdown-priority-form-label"
                  label="Priority"
                  value={breakdownForm.priority}
                  onChange={(event) =>
                    setBreakdownForm((prev) => ({
                      ...prev,
                      priority: event.target.value as BreakdownPriority,
                    }))
                  }
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="breakdown-status-form-label">
                  Status
                </InputLabel>
                <Select
                  labelId="breakdown-status-form-label"
                  label="Status"
                  value={breakdownForm.status}
                  onChange={(event) =>
                    setBreakdownForm((prev) => ({
                      ...prev,
                      status: event.target.value as BreakdownStatus,
                    }))
                  }
                >
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="INVESTIGATING">Investigating</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Problem Description"
              required
              multiline
              minRows={3}
              fullWidth
              value={breakdownForm.problem_description}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  problem_description: event.target.value,
                }))
              }
            />

            <TextField
              label="Root Cause"
              multiline
              minRows={2}
              fullWidth
              value={breakdownForm.root_cause}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  root_cause: event.target.value,
                }))
              }
            />

            <TextField
              label="Corrective Action"
              multiline
              minRows={2}
              fullWidth
              value={breakdownForm.corrective_action}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  corrective_action: event.target.value,
                }))
              }
            />

            <TextField
              label="Remarks"
              multiline
              minRows={2}
              fullWidth
              value={breakdownForm.remarks}
              onChange={(event) =>
                setBreakdownForm((prev) => ({
                  ...prev,
                  remarks: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setBreakdownDialog(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => void saveBreakdown()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Breakdown"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({ ...prev, open: false }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
