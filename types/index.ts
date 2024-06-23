export interface QueryParams {
  page?: string;
  per_page?: string;
  search?: string;
  transactionMonth?: string;
}

export interface StatsQueryParams {
  month?: number | string;
  year?: number;
}

export interface StatsResponse {
  totalSaleAmount: number;
  totalSoldItems: number;
  totalNotSoldItems: number;
}

export interface BarChartQueryParams {
  month?: string;
}

export interface BarChartResponse {
  priceRange: string;
  itemCount: number;
}

export interface PieChartQueryParams {
  month?: string;
}

export interface PieChartResponse {
  category: string;
  itemCount: number;
}
