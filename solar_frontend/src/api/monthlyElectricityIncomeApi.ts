
import api from "./axios";

export interface MonthlyElectricityIncome {
  id: number;
  site: number;
  site_name: string;
  year: number;
  month: number;
  income_amount: string;
  remarks: string;
  entered_by: number | null;
  entered_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyElectricityIncomePayload {
  site: number;
  year: number;
  month: number;
  income_amount: string;
  remarks?: string;
}

// GET - List monthly income records
export const getMonthlyElectricityIncome = async (
  params?: {
    site?: number;
    year?: number;
    month?: number;
  }
) => {
  const response = await api.get(
    "/monthly-electricity-income/",
    { params }
  );

  return response.data;
};

// POST - Create monthly income
export const createMonthlyElectricityIncome = async (
  data: MonthlyElectricityIncomePayload
) => {
  const response = await api.post(
    "/monthly-electricity-income/",
    data
  );

  return response.data;
};

// PATCH - Update monthly income
export const updateMonthlyElectricityIncome = async (
  id: number,
  data: Partial<MonthlyElectricityIncomePayload>
) => {
  const response = await api.patch(
    `/monthly-electricity-income/${id}/`,
    data
  );

  return response.data;
};

// DELETE - Delete monthly income
export const deleteMonthlyElectricityIncome = async (
  id: number
) => {
  const response = await api.delete(
    `/monthly-electricity-income/${id}/`
  );

  return response.data;
};
