import React, { useEffect, useMemo, useState } from "react";

import {

  Alert,

  Box,

  Button,

  Chip,

  CircularProgress,

  Dialog,

  DialogActions,

  DialogContent,

  DialogTitle,

  Divider,

  IconButton,

  InputAdornment,

  MenuItem,

  Paper,

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

import SearchIcon from "@mui/icons-material/Search";

import RefreshIcon from "@mui/icons-material/Refresh";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import CloseIcon from "@mui/icons-material/Close";

import api from "../../api/axios";

/* ============================================================

   TYPES

\============================================================ */

interface Site {

  id: number;

  name: string;

  asset_code: string;

  address: string;

  capacity_kwp: string | number;

  project_investment: string | number | null;

  expected_daily_generation_kwh: string | number | null;

  monitoring_portal: string;

  plant_id: string;

  inverter_model: string;

  panel_model: string;

  agreement_reference: string;

  agreement_date: string | null;

  commissioning_date: string | null;

  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "PLANNED";

  is_active: boolean;

  created_at: string;

  updated_at: string;

}

interface SiteFormData {

  name: string;

  asset_code: string;

  address: string;

  capacity_kwp: string;

  project_investment: string;

  expected_daily_generation_kwh: string;

  monitoring_portal: string;

  plant_id: string;

  inverter_model: string;

  panel_model: string;

  agreement_reference: string;

  agreement_date: string;

  commissioning_date: string;

  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "PLANNED";

}

/* ============================================================

   DEFAULT FORM

\============================================================ */

const emptyForm: SiteFormData = {

  name: "",

  asset_code: "",

  address: "",

  capacity_kwp: "",

  project_investment: "",

  expected_daily_generation_kwh: "",

  monitoring_portal: "",

  plant_id: "",

  inverter_model: "",

  panel_model: "",

  agreement_reference: "",

  agreement_date: "",

  commissioning_date: "",

  status: "ACTIVE",

};

/* ============================================================

   COMPONENT

\============================================================ */

const SiteMaster: React.FC = () => {

  /* ==========================================================

     LIST STATE

  ========================================================== */

  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  /* ==========================================================

     DIALOG STATE

  ========================================================== */

  const [openDialog, setOpenDialog] = useState(false);

  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">(

    "add"

  );

  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  /* ==========================================================

     FORM STATE

  ========================================================== */

  const [formData, setFormData] = useState<SiteFormData>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  /* ==========================================================

     LOAD SITES

  ========================================================== */

  const loadSites = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await api.get<Site[]>("/sites/");

      setSites(response.data);

    } catch (error: any) {

      console.error("Failed to load sites:", error);

      setError(

        error.response?.data?.detail ||

          "Unable to load sites. Please try again."

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadSites();

  }, []);

  /* ==========================================================

     SEARCH

  ========================================================== */

  const filteredSites = useMemo(() => {

    const value = search.trim().toLowerCase();

    if (!value) {

      return sites;

    }

    return sites.filter((site) => {

      return (

        site.name.toLowerCase().includes(value) ||

        site.asset_code.toLowerCase().includes(value) ||

        site.address.toLowerCase().includes(value) ||

        site.plant_id.toLowerCase().includes(value) ||

        site.inverter_model.toLowerCase().includes(value) ||

        site.panel_model.toLowerCase().includes(value)

      );

    });

  }, [sites, search]);

  /* ==========================================================

     FORM CHANGE

  ========================================================== */

  const handleChange = (

    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>

  ) => {

    const { name, value } = event.target;

    setFormData((previous) => ({

      ...previous,

      [name]: value,

    }));

  };

  /* ==========================================================

     OPEN ADD

  ========================================================== */

  const handleAddSite = () => {

    setSelectedSite(null);

    setFormData(emptyForm);

    setFormError("");

    setDialogMode("add");

    setOpenDialog(true);

  };

  /* ==========================================================

     OPEN EDIT

  ========================================================== */

  const handleEditSite = (site: Site) => {

    setSelectedSite(site);

    setFormData({

      name: site.name || "",

      asset_code: site.asset_code || "",

      address: site.address || "",

      capacity_kwp:

        site.capacity_kwp !== null && site.capacity_kwp !== undefined

          ? String(site.capacity_kwp)

          : "",

      project_investment:

        site.project_investment !== null &&

        site.project_investment !== undefined

          ? String(site.project_investment)

          : "",

      expected_daily_generation_kwh:

        site.expected_daily_generation_kwh !== null &&

        site.expected_daily_generation_kwh !== undefined

          ? String(site.expected_daily_generation_kwh)

          : "",

      monitoring_portal: site.monitoring_portal || "",

      plant_id: site.plant_id || "",

      inverter_model: site.inverter_model || "",

      panel_model: site.panel_model || "",

      agreement_reference: site.agreement_reference || "",

      agreement_date: site.agreement_date

        ? site.agreement_date.substring(0, 10)

        : "",

      commissioning_date: site.commissioning_date

        ? site.commissioning_date.substring(0, 10)

        : "",

      status: site.status || "ACTIVE",

    });

    setFormError("");

    setDialogMode("edit");

    setOpenDialog(true);

  };

  /* ==========================================================

     OPEN VIEW

  ========================================================== */

  const handleViewSite = (site: Site) => {

    setSelectedSite(site);

    setFormData({

      name: site.name || "",

      asset_code: site.asset_code || "",

      address: site.address || "",

      capacity_kwp:

        site.capacity_kwp !== null && site.capacity_kwp !== undefined

          ? String(site.capacity_kwp)

          : "",

      project_investment:

        site.project_investment !== null &&

        site.project_investment !== undefined

          ? String(site.project_investment)

          : "",

      expected_daily_generation_kwh:

        site.expected_daily_generation_kwh !== null &&

        site.expected_daily_generation_kwh !== undefined

          ? String(site.expected_daily_generation_kwh)

          : "",

      monitoring_portal: site.monitoring_portal || "",

      plant_id: site.plant_id || "",

      inverter_model: site.inverter_model || "",

      panel_model: site.panel_model || "",

      agreement_reference: site.agreement_reference || "",

      agreement_date: site.agreement_date

        ? site.agreement_date.substring(0, 10)

        : "",

      commissioning_date: site.commissioning_date

        ? site.commissioning_date.substring(0, 10)

        : "",

      status: site.status || "ACTIVE",

    });

    setFormError("");

    setDialogMode("view");

    setOpenDialog(true);

  };

  /* ==========================================================

     CLOSE DIALOG

  ========================================================== */

  const handleCloseDialog = () => {

    if (saving) {

      return;

    }

    setOpenDialog(false);

    setSelectedSite(null);

    setFormError("");

  };

  /* ==========================================================

     VALIDATION

  ========================================================== */

  const validateForm = () => {

    if (!formData.name.trim()) {

      setFormError("Site name is required.");

      return false;

    }

    if (!formData.asset_code.trim()) {

      setFormError("Asset code is required.");

      return false;

    }

    if (!formData.capacity_kwp.trim()) {

      setFormError("Installed capacity is required.");

      return false;

    }

    const capacity = Number(formData.capacity_kwp);

    if (Number.isNaN(capacity) || capacity < 0) {

      setFormError("Capacity must be a valid positive number.");

      return false;

    }

    if (

      formData.project_investment &&

      (Number.isNaN(Number(formData.project_investment)) ||

        Number(formData.project_investment) < 0)

    ) {

      setFormError("Project investment must be a valid number.");

      return false;

    }

    if (

      formData.expected_daily_generation_kwh &&

      (Number.isNaN(

        Number(formData.expected_daily_generation_kwh)

      ) ||

        Number(formData.expected_daily_generation_kwh) < 0)

    ) {

      setFormError("Expected daily generation must be a valid number.");

      return false;

    }

    return true;

  };

  /* ==========================================================

     SAVE SITE

  ========================================================== */

  const handleSave = async () => {

    setFormError("");

    if (!validateForm()) {

      return;

    }

    try {

      setSaving(true);

      const payload = {

        name: formData.name.trim(),

        asset_code: formData.asset_code.trim(),

        address: formData.address.trim(),

        capacity_kwp: Number(formData.capacity_kwp),

        project_investment: formData.project_investment

          ? Number(formData.project_investment)

          : null,

        expected_daily_generation_kwh:

          formData.expected_daily_generation_kwh

            ? Number(formData.expected_daily_generation_kwh)

            : null,

        monitoring_portal: formData.monitoring_portal.trim(),

        plant_id: formData.plant_id.trim(),

        inverter_model: formData.inverter_model.trim(),

        panel_model: formData.panel_model.trim(),

        agreement_reference: formData.agreement_reference.trim(),

        agreement_date: formData.agreement_date || null,

        commissioning_date: formData.commissioning_date || null,

        status: formData.status,

        is_active: formData.status !== "INACTIVE",

      };

      if (dialogMode === "add") {

        await api.post("/sites/", payload);

      } else if (dialogMode === "edit" && selectedSite) {

        await api.patch(`/sites/${selectedSite.id}/`, payload);

      }

      setOpenDialog(false);

      setSelectedSite(null);

      setFormData(emptyForm);

      await loadSites();

    } catch (error: any) {

      console.error("Failed to save site:", error);

      const responseData = error.response?.data;

      if (responseData && typeof responseData === "object") {

        const messages = Object.entries(responseData)

          .map(([field, message]) => `${field}: ${message}`)

          .join(" ");

        setFormError(messages || "Unable to save site.");

      } else {

        setFormError(

          "Unable to save site. Please check the information and try again."

        );

      }

    } finally {

      setSaving(false);

    }

  };

  /* ==========================================================

     FORMAT NUMBER

  ========================================================== */

  const formatNumber = (

    value: string | number | null | undefined

  ) => {

    if (value === null || value === undefined || value === "") {

      return "-";

    }

    const number = Number(value);

    if (Number.isNaN(number)) {

      return "-";

    }

    return number.toLocaleString("en-US", {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,

    });

  };

  /* ==========================================================

     STATUS COLOR

  ========================================================== */

  const getStatusColor = (

    status: Site["status"]

  ): "success" | "default" | "warning" | "info" => {

    switch (status) {

      case "ACTIVE":

        return "success";

      case "MAINTENANCE":

        return "warning";

      case "PLANNED":

        return "info";

      case "INACTIVE":

      default:

        return "default";

    }

  };

  /* ==========================================================

     STATUS LABEL

  ========================================================== */

  const getStatusLabel = (status: string) => {

    switch (status) {

      case "ACTIVE":

        return "Active";

      case "INACTIVE":

        return "Inactive";

      case "MAINTENANCE":

        return "Maintenance";

      case "PLANNED":

        return "Planned";

      default:

        return status;

    }

  };

  /* ==========================================================

     RENDER

  ========================================================== */

  return (

    <Box
      sx={{
        maxWidth: "none",
        mx: "auto",
        color: "#1E293B",
      }}
    >

      {/* ======================================================

          PAGE HEADER

      ====================================================== */}

      <Box

        sx={{

          display: "flex",

          flexDirection: { xs: "column", sm: "row" },

          alignItems: { xs: "flex-start", sm: "center" },

          justifyContent: "space-between",

          gap: 2,

          mb: 3,

        }}

      >

        <Box>

          <Typography

            variant="h4"

            fontWeight={800}

            sx={{

              fontSize: {

                xs: "1.6rem",

                sm: "2rem",
              },
              color: "#111C30",

            }}

          >

            Site & Asset Master

          </Typography>

          <Typography

            variant="body2"

            color="text.secondary"

            sx={{ mt: 0.5 }}

          >

            Manage solar sites, capacity, investment and system information.

          </Typography>

        </Box>

        <Button

          variant="contained"

          startIcon={<AddIcon />}

          onClick={handleAddSite}

          sx={{

            minHeight: 42,

            whiteSpace: "nowrap",
            backgroundColor: "#087F78",
            color: "#FFFFFF",
            fontWeight: 700,
            borderRadius: 2,
            "&:hover": { backgroundColor: "#06665F" },

          }}

        >

          Add Site

        </Button>

      </Box>

      {/* ======================================================

          ERROR

      ====================================================== */}

      {error && (

        <Alert

          severity="error"

          sx={{ mb: 2 }}

          action={

            <Button

              color="inherit"

              size="small"

              onClick={loadSites}

            >

              Retry

            </Button>

          }

        >

          {error}

        </Alert>

      )}

      {/* ======================================================

          MAIN CARD

      ====================================================== */}

      <Paper

        elevation={0}

        sx={{

          border: "1px solid #DCE3ED",

          borderRadius: 3,

          backgroundColor: "#FFFFFF",

          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.05)",

          overflow: "hidden",

        }}

      >

        {/* ====================================================

            TOOLBAR

        ==================================================== */}

        <Box

          sx={{

            p: 2,

            display: "flex",

            flexDirection: {

              xs: "column",

              sm: "row",

            },

            gap: 2,

            alignItems: {

              xs: "stretch",

              sm: "center",

            },

            justifyContent: "space-between",

            borderBottom: "1px solid",

            borderColor: "divider",

          }}

        >

          <TextField

            size="small"

            placeholder="Search sites..."

            value={search}

            onChange={(event) => setSearch(event.target.value)}

            sx={{

              width: {

                xs: "100%",

                sm: 340,

              },

            }}

            slotProps={{

              input: {

                startAdornment: (

                  <InputAdornment position="start">

                    <SearchIcon

                      sx={{

                        color: "text.secondary",

                      }}

                    />

                  </InputAdornment>

                ),

              },

            }}

          />

          <Button

            variant="outlined"

            startIcon={<RefreshIcon />}

            onClick={loadSites}

            disabled={loading}

            sx={{

              minHeight: 40,

            }}

          >

            Refresh

          </Button>

        </Box>

        {/* ====================================================

            TABLE

        ==================================================== */}

        {loading ? (

          <Box

            sx={{

              minHeight: 300,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

            }}

          >

            <CircularProgress />

          </Box>

        ) : (

          <TableContainer

            sx={{

              width: "100%",

              overflowX: "auto",

            }}

          >

            <Table

              sx={{

                minWidth: 1050,

              }}

            >

              <TableHead>

                <TableRow

                  sx={{

                    backgroundColor: "action.hover",

                  }}

                >

                  <TableCell>

                    <strong>Site</strong>

                  </TableCell>

                  <TableCell>

                    <strong>Asset Code</strong>

                  </TableCell>

                  <TableCell>

                    <strong>Capacity</strong>

                  </TableCell>

                  <TableCell>

                    <strong>Investment</strong>

                  </TableCell>

                  <TableCell>

                    <strong>Expected Daily</strong>

                  </TableCell>

                  <TableCell>

                    <strong>Plant ID</strong>

                  </TableCell>

                  <TableCell>

                    <strong>Status</strong>

                  </TableCell>

                  <TableCell align="right">

                    <strong>Actions</strong>

                  </TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {filteredSites.length === 0 ? (

                  <TableRow>

                    <TableCell

                      colSpan={8}

                      align="center"

                      sx={{

                        py: 7,

                      }}

                    >

                      <Typography

                        color="text.secondary"

                      >

                        {search

                          ? "No sites match your search."

                          : "No sites found."}

                      </Typography>

                      {!search && (

                        <Button

                          variant="outlined"

                          startIcon={<AddIcon />}

                          onClick={handleAddSite}

                          sx={{ mt: 2 }}

                        >

                          Add First Site

                        </Button>

                      )}

                    </TableCell>

                  </TableRow>

                ) : (

                  filteredSites.map((site) => (

                    <TableRow

                      key={site.id}

                      hover

                    >

                      {/* SITE */}

                      <TableCell>

                        <Typography

                          fontWeight={600}

                        >

                          {site.name}

                        </Typography>

                        {site.address && (

                          <Typography

                            variant="caption"

                            color="text.secondary"

                          >

                            {site.address}

                          </Typography>

                        )}

                      </TableCell>

                      {/* ASSET CODE */}

                      <TableCell>

                        {site.asset_code}

                      </TableCell>

                      {/* CAPACITY */}

                      <TableCell>

                        {formatNumber(

                          site.capacity_kwp

                        )}{" "}

                        kWp

                      </TableCell>

                      {/* INVESTMENT */}

                      <TableCell>

                        {site.project_investment !==

                        null

                          ? formatNumber(

                              site.project_investment

                            )

                          : "-"}

                      </TableCell>

                      {/* EXPECTED DAILY */}

                      <TableCell>

                        {site.expected_daily_generation_kwh !==

                        null

                          ? `${formatNumber(

                              site.expected_daily_generation_kwh

                            )} kWh`

                          : "-"}

                      </TableCell>

                      {/* PLANT ID */}

                      <TableCell>

                        {site.plant_id || "-"}

                      </TableCell>

                      {/* STATUS */}

                      <TableCell>

                        <Chip

                          label={getStatusLabel(

                            site.status

                          )}

                          color={getStatusColor(

                            site.status

                          )}

                          size="small"

                        />

                      </TableCell>

                      {/* ACTIONS */}

                      <TableCell align="right">

                        <Box

                          sx={{

                            display: "flex",

                            justifyContent: "flex-end",

                            gap: 0.5,

                          }}

                        >

                          <IconButton

                            size="small"

                            title="View"

                            onClick={() =>

                              handleViewSite(site)

                            }

                          >

                            <VisibilityOutlinedIcon fontSize="small" />

                          </IconButton>

                          <IconButton

                            size="small"

                            title="Edit"

                            onClick={() =>

                              handleEditSite(site)

                            }

                          >

                            <EditOutlinedIcon fontSize="small" />

                          </IconButton>

                        </Box>

                      </TableCell>

                    </TableRow>

                  ))

                )}

              </TableBody>

            </Table>

          </TableContainer>

        )}

      </Paper>

      {/* ======================================================

          FOOTER COUNT

      ====================================================== */}

      {!loading && (

        <Box

          sx={{

            mt: 2,

            display: "flex",

            justifyContent: "flex-end",

          }}

        >

          <Typography

            variant="body2"

            color="text.secondary"

          >

            Showing {filteredSites.length} of{" "}

            {sites.length} sites

          </Typography>

        </Box>

      )}

      {/* ======================================================

          ADD / EDIT / VIEW DIALOG

      ====================================================== */}

      <Dialog

        open={openDialog}

        onClose={handleCloseDialog}

        fullWidth

        maxWidth="md"

      >

        {/* ====================================================

            DIALOG TITLE

        ==================================================== */}

        <DialogTitle

          sx={{

            pr: 6,

          }}

        >

          <Typography

            variant="h6"

            fontWeight={700}

          >

            {dialogMode === "add"

              ? "Add Solar Site"

              : dialogMode === "edit"

              ? "Edit Solar Site"

              : "Site Details"}

          </Typography>

          <Typography

            variant="body2"

            color="text.secondary"

            sx={{ mt: 0.5 }}

          >

            {dialogMode === "add"

              ? "Enter the basic information for the solar site."

              : dialogMode === "edit"

              ? "Update the solar site information."

              : "View solar site information."}

          </Typography>

          <IconButton

            onClick={handleCloseDialog}

            disabled={saving}

            sx={{

              position: "absolute",

              right: 12,

              top: 12,

            }}

          >

            <CloseIcon />

          </IconButton>

        </DialogTitle>

        <Divider />

        {/* ====================================================

            FORM

        ==================================================== */}

        <DialogContent

          sx={{

            pt: 3,

          }}

        >

          {formError && (

            <Alert

              severity="error"

              sx={{ mb: 3 }}

            >

              {formError}

            </Alert>

          )}

          {/* ================================================

              SITE IDENTIFICATION

          ================================================= */}

          <Typography

            variant="subtitle1"

            fontWeight={700}

            sx={{ mb: 2 }}

          >

            Site Identification

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

              label="Site Name"

              name="name"

              value={formData.name}

              onChange={handleChange}

              required

              disabled={dialogMode === "view"}

              fullWidth

            />

            <TextField

              label="Asset Code"

              name="asset_code"

              value={formData.asset_code}

              onChange={handleChange}

              required

              disabled={dialogMode === "view"}

              fullWidth

            />

            <TextField

              label="Address"

              name="address"

              value={formData.address}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

              sx={{

                gridColumn: {

                  xs: "auto",

                  sm: "1 / -1",

                },

              }}

            />

          </Box>

          {/* ================================================

              CAPACITY & INVESTMENT

          ================================================= */}

          <Typography

            variant="subtitle1"

            fontWeight={700}

            sx={{

              mt: 4,

              mb: 2,

            }}

          >

            System Capacity & Investment

          </Typography>

          <Box

            sx={{

              display: "grid",

              gridTemplateColumns: {

                xs: "1fr",

                sm: "1fr 1fr 1fr",

              },

              gap: 2,

            }}

          >

            <TextField

              label="Installed Capacity"

              name="capacity_kwp"

              type="number"

              value={formData.capacity_kwp}

              onChange={handleChange}

              required

              disabled={dialogMode === "view"}

              fullWidth

              slotProps={{

                htmlInput: {

                  min: 0,

                  step: "0.01",

                },

                input: {

                  endAdornment: (

                    <InputAdornment position="end">

                      kWp

                    </InputAdornment>

                  ),

                },

              }}

            />

            <TextField

              label="Project Investment"

              name="project_investment"

              type="number"

              value={formData.project_investment}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

              slotProps={{

                htmlInput: {

                  min: 0,

                  step: "0.01",

                },

              }}

            />

            <TextField

              label="Expected Daily Generation"

              name="expected_daily_generation_kwh"

              type="number"

              value={

                formData.expected_daily_generation_kwh

              }

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

              slotProps={{

                htmlInput: {

                  min: 0,

                  step: "0.01",

                },

                input: {

                  endAdornment: (

                    <InputAdornment position="end">

                      kWh

                    </InputAdornment>

                  ),

                },

              }}

            />

          </Box>

          {/* ================================================

              MONITORING

          ================================================= */}

          <Typography

            variant="subtitle1"

            fontWeight={700}

            sx={{

              mt: 4,

              mb: 2,

            }}

          >

            Monitoring & Equipment

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

              label="Monitoring Portal"

              name="monitoring_portal"

              value={formData.monitoring_portal}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              placeholder="Example: Growatt ShineServer"

              fullWidth

            />

            <TextField

              label="Plant ID"

              name="plant_id"

              value={formData.plant_id}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

            />

            <TextField

              label="Inverter Model"

              name="inverter_model"

              value={formData.inverter_model}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

            />

            <TextField

              label="Panel Model"

              name="panel_model"

              value={formData.panel_model}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

            />

          </Box>

          {/* ================================================

              AGREEMENT

          ================================================= */}

          <Typography

            variant="subtitle1"

            fontWeight={700}

            sx={{

              mt: 4,

              mb: 2,

            }}

          >

            Agreement & Commissioning

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

              label="Agreement Reference"

              name="agreement_reference"

              value={formData.agreement_reference}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

            />

            <TextField

              label="Agreement Date"

              name="agreement_date"

              type="date"

              value={formData.agreement_date}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

              slotProps={{

                inputLabel: {

                  shrink: true,

                },

              }}

            />

            <TextField

              label="Commissioning Date"

              name="commissioning_date"

              type="date"

              value={formData.commissioning_date}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

              slotProps={{

                inputLabel: {

                  shrink: true,

                },

              }}

            />

            <TextField

              select

              label="Status"

              name="status"

              value={formData.status}

              onChange={handleChange}

              disabled={dialogMode === "view"}

              fullWidth

            >

              <MenuItem value="ACTIVE">

                Active

              </MenuItem>

              <MenuItem value="INACTIVE">

                Inactive

              </MenuItem>

              <MenuItem value="MAINTENANCE">

                Maintenance

              </MenuItem>

              <MenuItem value="PLANNED">

                Planned

              </MenuItem>

            </TextField>

          </Box>

        </DialogContent>

        {/* ====================================================

            DIALOG ACTIONS

        ==================================================== */}

        <DialogActions

          sx={{

            px: 3,

            py: 2,

            borderTop: "1px solid",

            borderColor: "divider",

          }}

        >

          <Button

            onClick={handleCloseDialog}

            disabled={saving}

          >

            {dialogMode === "view"

              ? "Close"

              : "Cancel"}

          </Button>

          {dialogMode !== "view" && (

            <Button

              variant="contained"

              onClick={handleSave}

              disabled={saving}

              startIcon={

                saving ? (

                  <CircularProgress

                    size={18}

                    color="inherit"

                  />

                ) : undefined

              }

            >

              {saving

                ? "Saving..."

                : dialogMode === "add"

                ? "Save Site"

                : "Update Site"}

            </Button>

          )}

        </DialogActions>

      </Dialog>

    </Box>

  );

};

export default SiteMaster;