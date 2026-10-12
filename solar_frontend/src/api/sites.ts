
import api from "./axios";

export interface Site {
  id: number;
  name: string;
  asset_code: string;
}

interface PaginatedSites {
  results: Site[];
}

export async function getSites(): Promise<Site[]> {
  const response = await api.get<Site[] | PaginatedSites>("/sites/");
  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}
