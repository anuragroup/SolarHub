import api from "./axios";

// ==========================================================
// TYPES
// ==========================================================

export interface GenerationRecord {
  id: number;
  site: number;
  site_name: string;
  generation_date: string;
  generation_kwh: string;
  expected_generation_kwh: string | null;
  performance_percentage: number | null;
  peak_power_kw: string | null;
  source: "API" | "MANUAL";
  sync_status: "SUCCESS" | "PENDING" | "FAILED";
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: number;
  site: number;
  site_name: string;
  reading_date: string;
  meter_serial_number: string;
  import_reading_kwh: string | null;
  export_reading_kwh: string | null;
  source: "MANUAL" | "API";
  logged_by: number | null;
  logged_by_name: string | null;
  remarks: string;
  created_at: string;
  updated_at: string;
}

// ==========================================================
// GENERATION API
// ==========================================================


export async function getGenerationRecords(): Promise<GenerationRecord[]> {
  const response = await api.get("/generation/");
  const data = response.data;

  if (Array.isArray(data)) {
    return data as GenerationRecord[];
  }

  if (data && Array.isArray(data.results)) {
    return data.results as GenerationRecord[];
  }

  return [];
}


// ==========================================================
// METER READING API
// ==========================================================

export async function getMeterReadings(): Promise<
  MeterReading[]
> {
  const response = await api.get<MeterReading[]>(
    "/meter-readings/"
  );

  return response.data;
}

// ==========================================================
// CREATE GENERATION RECORD
// ==========================================================

export interface CreateGenerationRecord {
  site: number;
  generation_date: string;
  generation_kwh: string;
  expected_generation_kwh?: string | null;
  peak_power_kw?: string | null;
  source: "API" | "MANUAL";
  sync_status: "SUCCESS" | "PENDING" | "FAILED";
}

export async function createGenerationRecord(
  data: CreateGenerationRecord
): Promise<GenerationRecord> {
  const response = await api.post<GenerationRecord>(
    "/generation/",
    data
  );

  return response.data;
}


// ==========================================================
// CREATE METER READING
// ==========================================================

export interface CreateMeterReading {
  site: number;
  reading_date: string;
  meter_serial_number?: string;
  import_reading_kwh?: string | null;
  export_reading_kwh?: string | null;
  source: "MANUAL" | "API";
  remarks?: string;
}

export async function createMeterReading(
  data: CreateMeterReading
): Promise<MeterReading> {
  const response = await api.post<MeterReading>(
    "/meter-readings/",
    data
  );

  return response.data;
}