import {
  DateRange
} from '../../types/analytics';
import {
  UUID
} from '../../types/common';

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

export interface AnalyticsServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Service for retrieving analytics and trend data
 */
export class AnalyticsService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: AnalyticsServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get activity trend data over time
   */
  async getActivityTrend(query: TrendQuery): Promise<TrendData> {
    const response = await this.fetchWithAuth('/analytics/trends/activity', {
      method: 'POST',
      body: JSON.stringify(query)
    });

    return response.json();
  }

  /**
   * Get county heatmap data
   */
  async getCountyHeatmap(dateRange: DateRange): Promise<HeatmapData> {
    const response = await this.fetchWithAuth('/analytics/heatmap/counties', {
      method: 'POST',
      body: JSON.stringify(dateRange)
    });

    return response.json();
  }

  /**
   * Get operator rankings
   */
  async getOperatorRankings(dateRange: DateRange, limit: number = 10): Promise<OperatorRanking[]> {
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await this.fetchWithAuth(`/analytics/rankings/operators?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(dateRange)
    });

    return response.json();
  }

  /**
   * Get approval rates
   */
  async getApprovalRates(filters: PermitFilters): Promise<ApprovalRateData> {
    const response = await this.fetchWithAuth('/analytics/approval-rates', {
      method: 'POST',
      body: JSON.stringify(filters)
    });

    return response.json();
  }

  /**
   * Get permit type breakdown
   */
  async getPermitTypeBreakdown(dateRange: DateRange): Promise<{
    drilling: number;
    amendment: number;
    recompletion: number;
    other: number;
  }> {
    const response = await this.fetchWithAuth('/analytics/breakdown/permit-types', {
      method: 'POST',
      body: JSON.stringify(dateRange)
    });

    return response.json();
  }

  /**
   * Get basin activity data
   */
  async getBasinActivity(dateRange: DateRange): Promise<{
    basin: string;
    permitCount: number;
  }[]> {
    const response = await this.fetchWithAuth('/analytics/activity/basins', {
      method: 'POST',
      body: JSON.stringify(dateRange)
    });

    return response.json();
  }

  /**
   * Get comparative analytics between two date ranges
   */
  async getComparativeAnalytics(
    currentRange: DateRange,
    previousRange: DateRange,
    filters: PermitFilters
  ): Promise<{
    currentPeriod: TrendData;
    previousPeriod: TrendData;
    percentChange: number;
  }> {
    const response = await this.fetchWithAuth('/analytics/comparative', {
      method: 'POST',
      body: JSON.stringify({ currentRange, previousRange, filters })
    });

    return response.json();
  }
}