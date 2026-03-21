import { NextRequest } from 'next/server';
import { createDatabaseClient } from '../../../../../../../src/lib/database';
import { createLogger } from '../../../../../../../src/services/logger';

const logger = createLogger({ service: 'operator-stats' });

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const db = createDatabaseClient();
    const operatorName = decodeURIComponent(params.name);
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'all';

    const { data: summary, error: summaryError } = await db
      .from('operator_stats_summary')
      .select('*')
      .eq('operator_name', operatorName)
      .single();

    if (summaryError || !summary) {
      return new Response(JSON.stringify({ error: 'Operator not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let dateFilter: string | null = null;
    switch (period) {
      case '30d':
        dateFilter = '30 days';
        break;
      case '90d':
        dateFilter = '90 days';
        break;
      case '365d':
        dateFilter = '365 days';
        break;
    }

    const permitsByMonthQuery = db
      .from('operator_permits_by_month')
      .select('*')
      .eq('operator_name', operatorName)
      .order('month', { ascending: true });

    if (dateFilter) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateFilter));
      permitsByMonthQuery.gte('month', startDate.toISOString().split('T')[0]);
    }

    const { data: permitsByMonth, error: monthError } = await permitsByMonthQuery;

    if (monthError) {
      logger.warn(`Failed to fetch permits by month: ${monthError.message}`);
    }

    const { data: countyHeatmap, error: countyError } = await db
      .from('operator_county_heatmap')
      .select('*')
      .eq('operator_name', operatorName)
      .order('permit_count', { ascending: false });

    if (countyError) {
      logger.warn(`Failed to fetch county heatmap: ${countyError.message}`);
    }

    const recentPermitsQuery = db
      .from('permits_clean')
      .select(`
        permit_number,
        api_number,
        lease_name,
        county,
        well_type,
        status,
        filed_date,
        issued_date,
        surface_lat,
        surface_lon
      `)
      .eq('operator_name', operatorName)
      .order('filed_date', { ascending: false })
      .limit(20);

    const { data: recentPermits, error: permitsError } = await recentPermitsQuery;

    if (permitsError) {
      logger.warn(`Failed to fetch recent permits: ${permitsError.message}`);
    }

    const kpiCards = {
      totalPermits: period === 'all' 
        ? summary.total_permits 
        : summary[`permits_last_${period === '30d' ? '30d' : period === '90d' ? '90d' : '365d'}`] || 0,
      approvalRate: summary.approval_rate_pct,
      countiesActive: countyHeatmap?.length || 0,
      lastFilingDate: summary.last_filing_date,
    };

    const chartData = {
      filingTrend: (permitsByMonth || []).map((row: Record<string, unknown>) => ({
        month: row.month,
        permitCount: row.permit_count,
        approved: row.approved_count,
        denied: row.denied_count,
      })),
      topCounties: (countyHeatmap || []).slice(0, 10).map((row: Record<string, unknown>) => ({
        county: row.county,
        permitCount: row.permit_count,
        lat: row.lat,
        lng: row.lng,
      })),
      topFormations: summary.top_formations || [],
    };

    return new Response(JSON.stringify({
      operator: {
        name: operatorName,
        activeSince: summary.active_since,
        lastFilingDate: summary.last_filing_date,
      },
      kpiCards,
      chartData,
      recentPermits: recentPermits || [],
      period,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error(`Operator stats error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
