
import api from "./axios";

// ==========================================================
// TYPES
// ==========================================================

export type MaintenanceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "INSPECTION"
  | "CLEANING"
  | "OTHER";

export type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type BreakdownPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type BreakdownStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export interface SiteOption {
  id: number;
  name: string;
  asset_code: string;
}

export interface MaintenanceSchedule {
  id: number;
  site: number;
  site_name: string;
  site_asset_code: string;
  title: string;
  maintenance_type: MaintenanceType;
  scheduled_date: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  status: MaintenanceStatus;
  description: string;
  work_performed: string;
  completed_date: string | null;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface Breakdown {
  id: number;
  site: number;
  site_name: string;
  site_asset_code: string;
  title: string;
  equipment_name: string;
  breakdown_date: string;
  priority: BreakdownPriority;
  status: BreakdownStatus;
  reported_by: number | null;
  reported_by_name: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  problem_description: string;
  root_cause: string;
  corrective_action: string;
  resolved_at: string | null;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export type CreateMaintenanceSchedule = {
  site: number;
  title: string;
  maintenance_type: MaintenanceType;
  scheduled_date: string;
  assigned_to?: number | null;
  status?: MaintenanceStatus;
  description?: string;
  work_performed?: string;
  completed_date?: string | null;
  remarks?: string;
};

export type CreateBreakdown = {
  site: number;
  title: string;
  equipment_name?: string;
  breakdown_date: string;
  priority: BreakdownPriority;
  status?: BreakdownStatus;
  problem_description: string;
  root_cause?: string;
  corrective_action?: string;
  assigned_to?: number | null;
  resolved_at?: string | null;
  remarks?: string;
};

// ==========================================================
// RESPONSE HANDLING
// Supports Django REST Framework paginated and plain arrays.
// ==========================================================

async function getList<T>(url: string): Promise<T[]> {
  const response = await api.get(url);
  const data = response.data;

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && Array.isArray(data.results)) {
    return data.results as T[];
  }

  return [];
}

// ==========================================================
// MAINTENANCE SCHEDULE API
// ==========================================================

export async function getMaintenanceSchedules(): Promise<
  MaintenanceSchedule[]
> {
  return getList<MaintenanceSchedule>("/maintenance-schedules/");
}

export async function createMaintenanceSchedule(
  data: CreateMaintenanceSchedule,
): Promise<MaintenanceSchedule> {
  const response = await api.post<MaintenanceSchedule>(
    "/maintenance-schedules/",
    data,
  );

  return response.data;
}

export async function updateMaintenanceSchedule(
  id: number,
  data: Partial<CreateMaintenanceSchedule>,
): Promise<MaintenanceSchedule> {
  const response = await api.patch<MaintenanceSchedule>(
    `/maintenance-schedules/${id}/`,
    data,
  );

  return response.data;
}

export async function deleteMaintenanceSchedule(
  id: number,
): Promise<void> {
  await api.delete(`/maintenance-schedules/${id}/`);
}

// ==========================================================
// BREAKDOWN API
// ==========================================================

export async function getBreakdowns(): Promise<Breakdown[]> {
  return getList<Breakdown>("/breakdowns/");
}

export async function createBreakdown(
  data: CreateBreakdown,
): Promise<Breakdown> {
  const response = await api.post<Breakdown>("/breakdowns/", data);
  return response.data;
}

export async function updateBreakdown(
  id: number,
  data: Partial<CreateBreakdown>,
): Promise<Breakdown> {
  const response = await api.patch<Breakdown>(`/breakdowns/${id}/`, data);
  return response.data;
}

export async function deleteBreakdown(id: number): Promise<void> {
  await api.delete(`/breakdowns/${id}/`);
}
