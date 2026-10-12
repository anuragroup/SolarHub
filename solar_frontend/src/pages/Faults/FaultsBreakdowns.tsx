import React, { useEffect, useMemo, useState } from "react";

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

  MenuItem,

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

import RefreshIcon from "@mui/icons-material/Refresh";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import api from "../../api/axios";

import {

  createBreakdown,

  getBreakdowns,

  updateBreakdown,

  type Breakdown,

  type BreakdownPriority,

  type BreakdownStatus,

  type CreateBreakdown,

} from "../../api/maintenance";

// ==========================================================

// TYPES

// ==========================================================

interface SiteOption {

  id: number;

  name: string;

  asset_code: string;

}

interface EmployeeOption {

  id: number;

  username: string;

  first_name: string;

  last_name: string;

  employee_no: string;

  role_names: string[];

}



interface FaultFormData {

  site: string;

  title: string;

  equipment_name: string;

  breakdown_date: string;

  priority: BreakdownPriority;

  problem_description: string;

  remarks: string;

}

interface BreakdownDetailsForm {

  status: BreakdownStatus;

  assigned_to: string;

  root_cause: string;

  corrective_action: string;

  remarks: string;

}

// ==========================================================

// HELPERS

// ==========================================================

const getCurrentLocalDateTime = (): string => {

  const now = new Date();

  const localDate = new Date(

    now.getTime() - now.getTimezoneOffset() * 60000,

  );

  return localDate.toISOString().slice(0, 16);

};

const createEmptyForm = (): FaultFormData => ({

  site: "",

  title: "",

  equipment_name: "",

  breakdown_date: getCurrentLocalDateTime(),

  priority: "MEDIUM",

  problem_description: "",

  remarks: "",

});

const formatDateTime = (

  value?: string | null,

): string => {

  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return value;

  }

  return date.toLocaleString();

};

const getApiErrorMessage = (err: any): string => {

  const data = err?.response?.data;

  if (typeof data?.detail === "string") {

    return data.detail;

  }

  if (data && typeof data === "object") {

    return Object.entries(data)

      .map(([field, messages]) => {

        const message = Array.isArray(messages)

          ? messages.join(", ")

          : String(messages);

        return `${field}: ${message}`;

      })

      .join(" | ");

  }

  return err?.message || "An unexpected error occurred.";

};

// ==========================================================

// COMPONENT

// ==========================================================

const FaultsBreakdowns: React.FC = () => {

  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);

  const [sites, setSites] = useState<SiteOption[]>([]);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  const [detailsError, setDetailsError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [formData, setFormData] =

    useState<FaultFormData>(createEmptyForm);

  const [selectedBreakdown, setSelectedBreakdown] =

    useState<Breakdown | null>(null);

  const [detailsForm, setDetailsForm] =

    useState<BreakdownDetailsForm>({

      status: "OPEN",

      assigned_to: "",

      root_cause: "",

      corrective_action: "",

      remarks: "",

    });

  // ========================================================

  // LOAD BREAKDOWNS

  // ========================================================

  const loadBreakdowns = async (): Promise<void> => {

    try {

      setLoading(true);

      setError("");

      const data = await getBreakdowns();

      setBreakdowns(data);

    } catch (err: any) {

      console.error(

        "Failed to load breakdowns:",

        err?.response?.data ?? err,

      );

      setError(getApiErrorMessage(err));

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    void loadBreakdowns();

  }, []);

  // ========================================================

  // LOAD SITES

  // Uses the same endpoint and direct-array response

  // as the working SiteMaster.tsx page.

  // ========================================================

  const loadSites = async (): Promise<void> => {

    const response = await api.get<SiteOption[]>("/sites/");

    if (!Array.isArray(response.data)) {

      throw new Error(

        "The Site Master API did not return a list of sites.",

      );

    }

    setSites(

      response.data.map((site) => ({

        id: Number(site.id),

        name: site.name,

        asset_code: site.asset_code ?? "",

      })),

    );

  };

  // ========================================================

  // SUMMARY COUNTS

  // ========================================================

  const counts = useMemo(

    () => ({

      open: breakdowns.filter(

        (item) => item.status === "OPEN",

      ).length,

      investigating: breakdowns.filter(

        (item) => item.status === "INVESTIGATING",

      ).length,

      inProgress: breakdowns.filter(

        (item) => item.status === "IN_PROGRESS",

      ).length,

      resolved: breakdowns.filter(

        (item) =>

          item.status === "RESOLVED" ||

          item.status === "CLOSED",

      ).length,

    }),

    [breakdowns],

  );

  // ========================================================

  // SEARCH AND FILTERS

  // ========================================================

  const filteredBreakdowns = useMemo(() => {

    const term = search.trim().toLowerCase();

    return breakdowns.filter((item) => {

      const matchesSearch =

        !term ||

        (item.title ?? "").toLowerCase().includes(term) ||

        (item.site_name ?? "").toLowerCase().includes(term) ||

        (item.equipment_name ?? "").toLowerCase().includes(term) ||

        (item.problem_description ?? "").toLowerCase().includes(term);

      const matchesStatus =

        statusFilter === "ALL" ||

        item.status === statusFilter;

      const matchesPriority =

        priorityFilter === "ALL" ||

        item.priority === priorityFilter;

      return (

        matchesSearch &&

        matchesStatus &&

        matchesPriority

      );

    });

  }, [

    breakdowns,

    search,

    statusFilter,

    priorityFilter,

  ]);

  // ========================================================

  // CHIP COLORS

  // ========================================================

  const getPriorityColor = (

    priority: BreakdownPriority,

  ): "default" | "info" | "warning" | "error" => {

    switch (priority) {

      case "LOW":

        return "info";

      case "MEDIUM":

        return "default";

      case "HIGH":

        return "warning";

      case "CRITICAL":

        return "error";

      default:

        return "default";

    }

  };

  const getStatusColor = (

    status: BreakdownStatus,

  ): "default" | "info" | "warning" | "success" => {

    switch (status) {

      case "OPEN":

        return "warning";

      case "INVESTIGATING":

      case "IN_PROGRESS":

        return "info";

      case "RESOLVED":

      case "CLOSED":

        return "success";

      default:

        return "default";

    }

  };

  // ========================================================

  // OPEN REPORT FORM

  // ========================================================

  const handleOpenForm = async (): Promise<void> => {

    setFormError("");

    setFormData(createEmptyForm());

    try {

      await loadSites();

      setFormOpen(true);

    } catch (err: any) {

      console.error(

        "Failed to load sites:",

        err?.response?.data ?? err,

      );

      setSites([]);

      setFormError(getApiErrorMessage(err));

      setFormOpen(true);

    }

  };

  // ========================================================

  // SUBMIT FAULT

  // ========================================================

  const handleReportFault = async (): Promise<void> => {

    setFormError("");

    if (

      !formData.site ||

      !formData.title.trim() ||

      !formData.breakdown_date ||

      !formData.problem_description.trim()

    ) {

      setFormError(

        "Please complete the site, fault title, reported date and time, and problem description.",

      );

      return;

    }

    const parsedDate = new Date(formData.breakdown_date);

    if (Number.isNaN(parsedDate.getTime())) {

      setFormError("Please enter a valid reported date and time.");

      return;

    }

    const payload: CreateBreakdown = {

      site: Number(formData.site),

      title: formData.title.trim(),

      equipment_name: formData.equipment_name.trim(),

      breakdown_date: parsedDate.toISOString(),

      priority: formData.priority,

      status: "OPEN",

      problem_description: formData.problem_description.trim(),

      remarks: formData.remarks.trim(),

    };

    try {

      setSaving(true);

      await createBreakdown(payload);

      setFormOpen(false);

      setFormData(createEmptyForm());

      setFormError("");

      setSuccessMessage("Fault reported successfully.");

      await loadBreakdowns();

    } catch (err: any) {

      console.error(

        "Report fault failed:",

        err?.response?.data ?? err,

      );

      setFormError(getApiErrorMessage(err));

    } finally {

      setSaving(false);

    }

  };

  const updateFormField = <

    K extends keyof FaultFormData,

  >(

    field: K,

    value: FaultFormData[K],

  ): void => {

    setFormData((previous) => ({

      ...previous,

      [field]: value,

    }));

  };

  // ========================================================

  // OPEN MANAGE DIALOG

  // ========================================================

  // ========================================================
  // LOAD EMPLOYEES FOR THE ASSIGNED TECHNICIAN DROPDOWN
  // GET /api/auth/employees/
  // ========================================================

  const loadEmployees = async (): Promise<void> => {
    const response = await api.get<EmployeeOption[]>("/auth/employees/");

    if (!Array.isArray(response.data)) {
      throw new Error("The employee API did not return a list.");
    }

    setEmployees(response.data);
  };

  const handleOpenDetails = async (item: Breakdown): Promise<void> => {

    setSelectedBreakdown(item);

    setDetailsError("");

    setDetailsForm({

      status: item.status,

      assigned_to:

        item.assigned_to != null ? String(item.assigned_to) : "",

      root_cause: item.root_cause ?? "",

      corrective_action: item.corrective_action ?? "",

      remarks: item.remarks ?? "",

    });

    try {

      await loadEmployees();

      setDetailsOpen(true);

    } catch (err: any) {

      console.error("Failed to load employees:", err?.response?.data ?? err);

      setDetailsError(getApiErrorMessage(err));

      setDetailsOpen(true);

    }

  };

  const updateDetailsField = <

    K extends keyof BreakdownDetailsForm,

  >(

    field: K,

    value: BreakdownDetailsForm[K],

  ): void => {

    setDetailsForm((previous) => ({

      ...previous,

      [field]: value,

    }));

  };

  // ========================================================

  // SAVE FAULT DETAILS

  // ========================================================

  const handleSaveDetails = async (): Promise<void> => {

    if (!selectedBreakdown) return;

    setDetailsError("");

    let assignedTo: number | null = null;

    if (detailsForm.assigned_to.trim() !== "") {

      assignedTo = Number(detailsForm.assigned_to);

      if (

        !Number.isInteger(assignedTo) ||

        assignedTo <= 0

      ) {

        setDetailsError(

          "Enter a valid positive technician user ID, or leave it blank to unassign.",

        );

        return;

      }

    }

    const payload: Partial<CreateBreakdown> = {

      status: detailsForm.status,

      assigned_to: assignedTo,

      root_cause: detailsForm.root_cause.trim(),

      corrective_action: detailsForm.corrective_action.trim(),

      remarks: detailsForm.remarks.trim(),

      resolved_at:

        detailsForm.status === "RESOLVED"

          ? selectedBreakdown.resolved_at ??

            new Date().toISOString()

          : null,

    };

    try {

      setSaving(true);

      await updateBreakdown(selectedBreakdown.id, payload);

      setDetailsOpen(false);

      setSelectedBreakdown(null);

      setSuccessMessage("Fault details updated successfully.");

      await loadBreakdowns();

    } catch (err: any) {

      console.error(

        "Update fault failed:",

        err?.response?.data ?? err,

      );

      setDetailsError(getApiErrorMessage(err));

    } finally {

      setSaving(false);

    }

  };

  // ========================================================

  // SUMMARY CARDS

  // ========================================================

  const summaryCards = [

    { label: "Open Faults", value: counts.open },

    { label: "Investigating", value: counts.investigating },

    { label: "In Progress", value: counts.inProgress },

    { label: "Resolved / Closed", value: counts.resolved },

  ];

  // ========================================================

  // RENDER

  // ========================================================

  return (

    <Box sx={{ maxWidth: 1400, mx: "auto" }}>

      {/* PAGE HEADER */}

      <Stack

        direction={{ xs: "column", md: "row" }}

        justifyContent="space-between"

        alignItems={{ xs: "stretch", md: "center" }}

        spacing={2}

        sx={{ mb: 3 }}

      >

        <Box>

          <Typography variant="h4" fontWeight={700}>

            Faults &amp; Breakdowns

          </Typography>

          <Typography

            color="text.secondary"

            sx={{ mt: 0.5 }}

          >

            Report, investigate, assign, and track solar equipment faults.

          </Typography>

        </Box>

        <Stack direction="row" spacing={1}>

          <Button

            variant="outlined"

            startIcon={<RefreshIcon />}

            onClick={() => void loadBreakdowns()}

            disabled={loading || saving}

          >

            Refresh

          </Button>

          <Button

            variant="contained"

            startIcon={<WarningAmberIcon />}

            onClick={() => void handleOpenForm()}

            disabled={saving}

          >

            Report Fault

          </Button>

        </Stack>

      </Stack>

      {error && (

        <Alert

          severity="error"

          sx={{ mb: 3 }}

          action={

            <Button

              color="inherit"

              size="small"

              onClick={() => void loadBreakdowns()}

            >

              Retry

            </Button>

          }

        >

          {error}

        </Alert>

      )}

      {/* SUMMARY CARDS */}

      <Box

        sx={{

          display: "grid",

          gridTemplateColumns: {

            xs: "repeat(2, minmax(0, 1fr))",

            md: "repeat(4, minmax(0, 1fr))",

          },

          gap: 2,

          mb: 3,

        }}

      >

        {summaryCards.map((card) => (

          <Card key={card.label} variant="outlined">

            <CardContent>

              <Typography

                color="text.secondary"

                variant="body2"

              >

                {card.label}

              </Typography>

              <Typography

                variant="h4"

                fontWeight={700}

                sx={{ mt: 1 }}

              >

                {loading ? "—" : card.value}

              </Typography>

            </CardContent>

          </Card>

        ))}

      </Box>

      {/* FAULT REGISTER */}

      <Card variant="outlined">

        <CardContent>

          <Typography

            variant="h6"

            fontWeight={600}

            sx={{ mb: 2 }}

          >

            Fault Register

          </Typography>

          <Box

            sx={{

              display: "grid",

              gridTemplateColumns: {

                xs: "1fr",

                md: "2fr 1fr 1fr",

              },

              gap: 2,

              mb: 2,

            }}

          >

            <TextField

              label="Search faults"

              placeholder="Search title, site, equipment..."

              value={search}

              onChange={(event) => setSearch(event.target.value)}

              fullWidth

              size="small"

            />

            <TextField

              select

              label="Status"

              value={statusFilter}

              onChange={(event) =>

                setStatusFilter(event.target.value)

              }

              fullWidth

              size="small"

            >

              <MenuItem value="ALL">All statuses</MenuItem>

              <MenuItem value="OPEN">Open</MenuItem>

              <MenuItem value="INVESTIGATING">Investigating</MenuItem>

              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>

              <MenuItem value="RESOLVED">Resolved</MenuItem>

              <MenuItem value="CLOSED">Closed</MenuItem>

            </TextField>

            <TextField

              select

              label="Priority"

              value={priorityFilter}

              onChange={(event) =>

                setPriorityFilter(event.target.value)

              }

              fullWidth

              size="small"

            >

              <MenuItem value="ALL">All priorities</MenuItem>

              <MenuItem value="LOW">Low</MenuItem>

              <MenuItem value="MEDIUM">Medium</MenuItem>

              <MenuItem value="HIGH">High</MenuItem>

              <MenuItem value="CRITICAL">Critical</MenuItem>

            </TextField>

          </Box>

          {loading ? (

            <Box

              sx={{

                display: "flex",

                justifyContent: "center",

                py: 6,

              }}

            >

              <CircularProgress />

            </Box>

          ) : (

            <TableContainer sx={{ overflowX: "auto" }}>

              <Table size="small">

                <TableHead>

                  <TableRow>

                    <TableCell>Fault</TableCell>

                    <TableCell>Site</TableCell>

                    <TableCell>Equipment</TableCell>

                    <TableCell>Reported Date</TableCell>

                    <TableCell>Priority</TableCell>

                    <TableCell>Status</TableCell>

                    <TableCell>Assigned To</TableCell>

                    <TableCell align="right">Actions</TableCell>

                  </TableRow>

                </TableHead>

                <TableBody>

                  {filteredBreakdowns.map((item) => (

                    <TableRow key={item.id} hover>

                      <TableCell>

                        <Typography

                          fontWeight={600}

                          variant="body2"

                        >

                          {item.title}

                        </Typography>

                        <Typography

                          variant="caption"

                          color="text.secondary"

                        >

                          #{item.id}

                        </Typography>

                      </TableCell>

                      <TableCell>

                        {item.site_name || "—"}

                        <Typography

                          variant="caption"

                          display="block"

                          color="text.secondary"

                        >

                          {item.site_asset_code || ""}

                        </Typography>

                      </TableCell>

                      <TableCell>

                        {item.equipment_name || "—"}

                      </TableCell>

                      <TableCell>

                        {formatDateTime(item.breakdown_date)}

                      </TableCell>

                      <TableCell>

                        <Chip

                          size="small"

                          label={item.priority}

                          color={getPriorityColor(item.priority)}

                        />

                      </TableCell>

                      <TableCell>

                        <Chip

                          size="small"

                          label={item.status.replace("_", " ")}

                          color={getStatusColor(item.status)}

                        />

                      </TableCell>

                      <TableCell>

                        {item.assigned_to_name || "Unassigned"}

                      </TableCell>

                      <TableCell align="right">

                        <Button

                          size="small"

                          variant="outlined"

                          startIcon={<ManageSearchIcon />}

                          onClick={() => void handleOpenDetails(item)}

                        >

                          Manage

                        </Button>

                      </TableCell>

                    </TableRow>

                  ))}

                  {filteredBreakdowns.length === 0 && (

                    <TableRow>

                      <TableCell

                        colSpan={8}

                        align="center"

                        sx={{ py: 5 }}

                      >

                        {breakdowns.length === 0

                          ? "No faults or breakdowns have been reported yet."

                          : "No faults match your search or filters."}

                      </TableCell>

                    </TableRow>

                  )}

                </TableBody>

              </Table>

            </TableContainer>

          )}

        </CardContent>

      </Card>

      {/* REPORT FAULT DIALOG */}

      <Dialog

        open={formOpen}

        onClose={() => {

          if (!saving) {

            setFormOpen(false);

            setFormError("");

          }

        }}

        fullWidth

        maxWidth="sm"

      >

        <DialogTitle>Report a Fault</DialogTitle>

        <DialogContent>

          <Stack spacing={2} sx={{ mt: 1 }}>

            {formError && (

              <Alert severity="error">{formError}</Alert>

            )}

            <TextField

              select

              label="Site"

              value={formData.site}

              onChange={(event) =>

                updateFormField("site", event.target.value)

              }

              required

              fullWidth

              disabled={saving}

            >

              {sites.map((site) => (

                <MenuItem

                  key={site.id}

                  value={String(site.id)}

                >

                  {site.name}

                  {site.asset_code

                    ? ` (${site.asset_code})`

                    : ""}

                </MenuItem>

              ))}

            </TextField>

            {sites.length === 0 && (

              <Typography

                variant="caption"

                color="text.secondary"

              >

                No site options loaded. Check the Site Master API and permissions.

              </Typography>

            )}

            <TextField

              label="Fault Title"

              value={formData.title}

              onChange={(event) =>

                updateFormField("title", event.target.value)

              }

              required

              fullWidth

              disabled={saving}

            />

            <TextField

              label="Equipment Name"

              value={formData.equipment_name}

              onChange={(event) =>

                updateFormField("equipment_name", event.target.value)

              }

              fullWidth

              disabled={saving}

              placeholder="e.g. Inverter 01"

            />

            <TextField

              label="Reported Date and Time"

              type="datetime-local"

              value={formData.breakdown_date}

              onChange={(event) =>

                updateFormField("breakdown_date", event.target.value)

              }

              slotProps={{

                inputLabel: { shrink: true },

              }}

              required

              fullWidth

              disabled={saving}

            />

            <TextField

              select

              label="Priority"

              value={formData.priority}

              onChange={(event) =>

                updateFormField(

                  "priority",

                  event.target.value as BreakdownPriority,

                )

              }

              fullWidth

              disabled={saving}

            >

              <MenuItem value="LOW">Low</MenuItem>

              <MenuItem value="MEDIUM">Medium</MenuItem>

              <MenuItem value="HIGH">High</MenuItem>

              <MenuItem value="CRITICAL">Critical</MenuItem>

            </TextField>

            <TextField

              label="Problem Description"

              value={formData.problem_description}

              onChange={(event) =>

                updateFormField(

                  "problem_description",

                  event.target.value,

                )

              }

              required

              multiline

              minRows={3}

              fullWidth

              disabled={saving}

            />

            <TextField

              label="Remarks"

              value={formData.remarks}

              onChange={(event) =>

                updateFormField("remarks", event.target.value)

              }

              multiline

              minRows={2}

              fullWidth

              disabled={saving}

            />

          </Stack>

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button

            onClick={() => {

              setFormOpen(false);

              setFormError("");

            }}

            disabled={saving}

          >

            Cancel

          </Button>

          <Button

            variant="contained"

            onClick={() => void handleReportFault()}

            disabled={saving || sites.length === 0}

          >

            {saving ? (

              <CircularProgress size={22} color="inherit" />

            ) : (

              "Submit Fault"

            )}

          </Button>

        </DialogActions>

      </Dialog>

      {/* MANAGE FAULT DIALOG */}

      <Dialog

        open={detailsOpen}

        onClose={() => {

          if (!saving) {

            setDetailsOpen(false);

            setDetailsError("");

          }

        }}

        fullWidth

        maxWidth="sm"

      >

        <DialogTitle>

          Manage Fault

          {selectedBreakdown

            ? ` #${selectedBreakdown.id}`

            : ""}

        </DialogTitle>

        <DialogContent>

          <Stack spacing={2} sx={{ mt: 1 }}>

            {detailsError && (

              <Alert severity="error">{detailsError}</Alert>

            )}

            {selectedBreakdown && (

              <Box>

                <Typography variant="subtitle1" fontWeight={600}>

                  {selectedBreakdown.title}

                </Typography>

                <Typography

                  variant="body2"

                  color="text.secondary"

                >

                  Site: {selectedBreakdown.site_name || "—"}

                  {" · "}

                  Equipment: {selectedBreakdown.equipment_name || "—"}

                </Typography>

                <Typography

                  variant="body2"

                  sx={{ mt: 1, whiteSpace: "pre-wrap" }}

                >

                  {selectedBreakdown.problem_description}

                </Typography>

              </Box>

            )}

            <TextField

              select

              label="Fault Status"

              value={detailsForm.status}

              onChange={(event) =>

                updateDetailsField(

                  "status",

                  event.target.value as BreakdownStatus,

                )

              }

              fullWidth

              disabled={saving}

            >

              <MenuItem value="OPEN">Open</MenuItem>

              <MenuItem value="INVESTIGATING">Investigating</MenuItem>

              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>

              <MenuItem value="RESOLVED">Resolved</MenuItem>

              <MenuItem value="CLOSED">Closed</MenuItem>

            </TextField>

            <TextField

              select

              label="Assigned Technician"

              value={detailsForm.assigned_to}

              onChange={(event) =>

                updateDetailsField("assigned_to", event.target.value)

              }

              fullWidth

              disabled={saving}

              helperText="Select an employee, or leave unassigned."

            >

              <MenuItem value="">Unassigned</MenuItem>

              {employees.map((employee) => {

                const fullName =

                  `${employee.first_name} ${employee.last_name}`.trim() ||

                  employee.username;

                const label = employee.employee_no

                  ? `${employee.employee_no} - ${fullName}`

                  : fullName;

                return (

                  <MenuItem key={employee.id} value={String(employee.id)}>

                    {label}

                  </MenuItem>

                );

              })}

            </TextField>

            <TextField

              label="Root Cause"

              value={detailsForm.root_cause}

              onChange={(event) =>

                updateDetailsField("root_cause", event.target.value)

              }

              multiline

              minRows={2}

              fullWidth

              disabled={saving}

            />

            <TextField

              label="Corrective Action"

              value={detailsForm.corrective_action}

              onChange={(event) =>

                updateDetailsField(

                  "corrective_action",

                  event.target.value,

                )

              }

              multiline

              minRows={2}

              fullWidth

              disabled={saving}

            />

            <TextField

              label="Remarks"

              value={detailsForm.remarks}

              onChange={(event) =>

                updateDetailsField("remarks", event.target.value)

              }

              multiline

              minRows={2}

              fullWidth

              disabled={saving}

            />

            {detailsForm.status === "RESOLVED" && (

              <Alert severity="info">

                Saving as Resolved records a resolution time if one has not already been recorded.

              </Alert>

            )}

          </Stack>

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button

            onClick={() => {

              setDetailsOpen(false);

              setDetailsError("");

            }}

            disabled={saving}

          >

            Cancel

          </Button>

          <Button

            variant="contained"

            onClick={() => void handleSaveDetails()}

            disabled={saving || !selectedBreakdown}

          >

            {saving ? (

              <CircularProgress size={22} color="inherit" />

            ) : (

              "Save Changes"

            )}

          </Button>

        </DialogActions>

      </Dialog>

      {/* SUCCESS MESSAGE */}

      <Snackbar

        open={Boolean(successMessage)}

        autoHideDuration={4000}

        onClose={() => setSuccessMessage("")}

        message={successMessage}

      />

    </Box>

  );

};

export default FaultsBreakdowns;
