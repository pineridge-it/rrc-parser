import { UUID } from './common';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PermitFilters {
  counties?: string[];
  operators?: UUID[];
  permitTypes?: string[];
  basins?: string[];
}

export interface TrendQuery {
  dateRange: DateRange;
  groupBy: 'day' | 'week' | 'month' | 'quarter';
  filters: PermitFilters;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface TrendDataset {
  label: string;
  data: TrendDataPoint[];
}

export interface TrendData {
  labels: string[];
  datasets: TrendDataset[];
}

export interface HeatmapDataPoint {
  county: string;
  value: number;
  latitude: number;
  longitude: number;
}

export interface HeatmapData {
  data: HeatmapDataPoint[];
  maxValue: number;
}

export interface OperatorRanking {
  operatorId: UUID;
  operatorName: string;
  permitCount: number;
  ranking: number;
}

export interface ApprovalRateData {
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
}

export interface AnalyticsQueryRequest {
  query: TrendQuery;
}

export interface DateRangeRequest {
  dateRange: DateRange;
}

export interface ComparativeAnalyticsRequest {
  currentRange: DateRange;
  previousRange: DateRange;
  filters: PermitFilters;
}

export interface AnalyticsResponse<T> {
  data: T;
  queryTime: number;
  cached: boolean;
}