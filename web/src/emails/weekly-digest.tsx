import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface SavedSearch {
  search_name: string;
  search_id: string;
  new_count: number;
  sample_permits: Array<{
    permit_api_number: string;
    operator_name: string;
    filed_date: string;
    county: string;
  }>;
}

interface StatusChange {
  permit_api_number: string;
  old_status: string;
  new_status: string;
  detected_at: string;
  subscription_name: string;
}

interface TopMover {
  permit_api_number: string;
  operator_name: string;
  county: string;
  status: string;
  filed_date: string;
}

interface NewOperator {
  operator_name: string;
  county: string;
  permit_count: number;
}

interface WeeklyDigestEmailProps {
  userName?: string;
  workspaceName: string;
  periodStart: string;
  periodEnd: string;
  savedSearches: SavedSearch[];
  statusChanges: StatusChange[];
  topMovers: TopMover[];
  newOperators: NewOperator[];
  summary: {
    total_new_permits: number;
    total_status_changes: number;
    total_saved_searches: number;
  };
  preferencesUrl: string;
  unsubscribeUrl: string;
  baseUrl: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: '#dcfce7', text: '#166534' },
  DENIED: { bg: '#fee2e2', text: '#991b1b' },
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  ACTIVE: { bg: '#dbeafe', text: '#1e40af' },
  INACTIVE: { bg: '#f3f4f6', text: '#374151' },
  DRILLING: { bg: '#e0e7ff', text: '#3730a3' },
  COMPLETED: { bg: '#d1fae5', text: '#065f46' },
};

const getStatusStyle = (status: string) => {
  return statusColors[status?.toUpperCase()] || { bg: '#f3f4f6', text: '#374151' };
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatWeekRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `Week of ${startDate.toLocaleDateString('en-US', options)}–${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;
};

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  userName,
  workspaceName,
  periodStart,
  periodEnd,
  savedSearches,
  statusChanges,
  topMovers,
  newOperators,
  summary,
  preferencesUrl,
  unsubscribeUrl,
  baseUrl,
}) => {
  const weekRange = formatWeekRange(periodStart, periodEnd);
  const totalNewPermits = summary?.total_new_permits || 0;
  const totalStatusChanges = summary?.total_status_changes || 0;
  const hasContent = totalNewPermits > 0 || totalStatusChanges > 0 || topMovers?.length > 0 || newOperators?.length > 0;

  return (
    <Html>
      <Head />
      <Preview>
        Your RRC Monitor Weekly Briefing: {totalNewPermits} new permits, {totalStatusChanges} status changes
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading as="h1" style={logo}>RRC Monitor</Heading>
            <Text style={headerSubtitle}>Your Weekly Briefing</Text>
            <Text style={dateRange}>{weekRange}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={heroStats}>
            <Row>
              <Column style={statColumn}>
                <Text style={statNumber}>{totalNewPermits}</Text>
                <Text style={statLabel}>New Permits</Text>
              </Column>
              <Column style={statColumn}>
                <Text style={statNumber}>{totalStatusChanges}</Text>
                <Text style={statLabel}>Status Changes</Text>
              </Column>
              <Column style={statColumn}>
                <Text style={statNumber}>{summary?.total_saved_searches || 0}</Text>
                <Text style={statLabel}>Active Searches</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {savedSearches?.length > 0 && (
            <>
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>Saved Search Activity</Heading>
                {savedSearches.map((search, idx) => (
                  <SearchSection 
                    key={idx}
                    search={search}
                    baseUrl={baseUrl}
                  />
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {statusChanges?.length > 0 && (
            <>
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>Permits You're Watching</Heading>
                <Text style={sectionSubtitle}>Status changes in your monitored permits</Text>
                {statusChanges.map((change, idx) => (
                  <StatusChangeRow key={idx} change={change} baseUrl={baseUrl} />
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {topMovers?.length > 0 && (
            <>
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>Top Movers in Your Areas</Heading>
                <Text style={sectionSubtitle}>Recent Approved/Denied decisions in monitored counties</Text>
                {topMovers.map((mover, idx) => (
                  <TopMoverCard key={idx} mover={mover} baseUrl={baseUrl} />
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {newOperators?.length > 0 && (
            <>
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>New Operator Activity</Heading>
                <Text style={sectionSubtitle}>Operators newly active in your monitored counties</Text>
                {newOperators.map((op, idx) => (
                  <NewOperatorRow key={idx} operator={op} baseUrl={baseUrl} />
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {!hasContent && (
            <Section style={emptySection}>
              <Text style={emptyText}>No new activity this week.</Text>
              <Text style={emptySubtext}>Check back next week for updates on permits in your monitored areas.</Text>
            </Section>
          )}

          <Section style={ctaSection}>
            <Button style={primaryButton} href={`${baseUrl}/permits`}>
              Explore All Permits
            </Button>
          </Section>

          <Section style={secondaryCtaSection}>
            <Link style={secondaryLink} href={preferencesUrl}>
              Manage Digest Preferences
            </Link>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>Sent by {workspaceName}</Text>
            <Text style={footerSubtext}>
              {userName ? `For ${userName} • ` : ''}Weekly digest
            </Text>
            <Link style={unsubscribeLink} href={unsubscribeUrl}>
              Unsubscribe or change frequency
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const SearchSection: React.FC<{ search: SavedSearch; baseUrl: string }> = ({ search, baseUrl }) => (
  <Container style={searchContainer}>
    <Row>
      <Column>
        <Text style={searchName}>{search.search_name}</Text>
      </Column>
      <Column style={searchCountColumn}>
        <Container style={searchCountPill}>
          <Text style={searchCountText}>{search.new_count} new</Text>
        </Container>
      </Column>
    </Row>
    {search.sample_permits?.slice(0, 3).map((permit, idx) => (
      <Container key={idx} style={permitRow}>
        <Row>
          <Column>
            <Link style={permitLink} href={`${baseUrl}/permits/${permit.permit_api_number}`}>
              {permit.permit_api_number}
            </Link>
            <Text style={operatorText}>{permit.operator_name}</Text>
          </Column>
          <Column style={permitMetaColumn}>
            <Text style={permitMetaText}>{permit.county}</Text>
          </Column>
        </Row>
      </Container>
    ))}
    {search.new_count > 3 && (
      <Link style={viewAllLink} href={`${baseUrl}/searches/${search.search_id}`}>
        View all {search.new_count} permits →
      </Link>
    )}
  </Container>
);

const StatusChangeRow: React.FC<{ change: StatusChange; baseUrl: string }> = ({ change, baseUrl }) => {
  const oldStyle = getStatusStyle(change.old_status);
  const newStyle = getStatusStyle(change.new_status);

  return (
    <Container style={statusChangeRow}>
      <Row>
        <Column style={statusChangeMain}>
          <Link style={permitLink} href={`${baseUrl}/permits/${change.permit_api_number}`}>
            {change.permit_api_number}
          </Link>
          <Text style={subscriptionNameText}>{change.subscription_name}</Text>
        </Column>
        <Column style={statusChangeBadges}>
          <Container style={{ ...statusBadge, backgroundColor: oldStyle.bg }}>
            <Text style={{ ...statusBadgeText, color: oldStyle.text }}>{change.old_status}</Text>
          </Container>
          <Text style={arrowText}>→</Text>
          <Container style={{ ...statusBadge, backgroundColor: newStyle.bg }}>
            <Text style={{ ...statusBadgeText, color: newStyle.text }}>{change.new_status}</Text>
          </Container>
        </Column>
      </Row>
    </Container>
  );
};

const TopMoverCard: React.FC<{ mover: TopMover; baseUrl: string }> = ({ mover, baseUrl }) => {
  const statusStyle = getStatusStyle(mover.status);

  return (
    <Container style={moverCard}>
      <Row>
        <Column style={moverMain}>
          <Link style={permitLink} href={`${baseUrl}/permits/${mover.permit_api_number}`}>
            {mover.permit_api_number}
          </Link>
          <Text style={operatorText}>{mover.operator_name}</Text>
          <Text style={countyText}>{mover.county}</Text>
        </Column>
        <Column style={moverStatus}>
          <Container style={{ ...statusBadge, backgroundColor: statusStyle.bg }}>
            <Text style={{ ...statusBadgeText, color: statusStyle.text }}>{mover.status}</Text>
          </Container>
        </Column>
      </Row>
    </Container>
  );
};

const NewOperatorRow: React.FC<{ operator: NewOperator; baseUrl: string }> = ({ operator, baseUrl }) => (
  <Container style={operatorRow}>
    <Row>
      <Column>
        <Link style={operatorLink} href={`${baseUrl}/operators/${encodeURIComponent(operator.operator_name)}`}>
          {operator.operator_name}
        </Link>
        <Text style={countyText}>{operator.county}</Text>
      </Column>
      <Column style={operatorCountColumn}>
        <Text style={operatorCountText}>{operator.permit_count} permit{operator.permit_count !== 1 ? 's' : ''}</Text>
      </Column>
    </Row>
  </Container>
);

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px 24px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#111827',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};

const headerSubtitle = {
  color: '#6b7280',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const dateRange = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '0',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '0',
};

const heroStats = {
  padding: '24px 40px',
};

const statColumn = {
  textAlign: 'center' as const,
  padding: '0 16px',
};

const statNumber = {
  color: '#111827',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const section = {
  padding: '24px 40px',
};

const sectionTitle = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const sectionSubtitle = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 20px 0',
};

const searchContainer = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  marginBottom: '16px',
  padding: '16px',
};

const searchName = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const searchCountColumn = {
  textAlign: 'right' as const,
};

const searchCountPill = {
  backgroundColor: '#dbeafe',
  borderRadius: '12px',
  display: 'inline-block',
  padding: '4px 10px',
};

const searchCountText = {
  color: '#1e40af',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0',
};

const permitRow = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '12px',
  paddingTop: '12px',
};

const permitLink = {
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
};

const operatorText = {
  color: '#4b5563',
  fontSize: '13px',
  margin: '2px 0 0 0',
};

const permitMetaColumn = {
  textAlign: 'right' as const,
};

const permitMetaText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

const viewAllLink = {
  color: '#2563eb',
  fontSize: '13px',
  textDecoration: 'none',
  display: 'block',
  marginTop: '12px',
};

const statusChangeRow = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  marginBottom: '8px',
  padding: '12px 16px',
};

const statusChangeMain = {
  width: '60%',
};

const subscriptionNameText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '2px 0 0 0',
};

const statusChangeBadges = {
  textAlign: 'right' as const,
  whiteSpace: 'nowrap' as const,
};

const statusBadge = {
  borderRadius: '4px',
  display: 'inline-block',
  padding: '4px 8px',
};

const statusBadgeText = {
  fontSize: '11px',
  fontWeight: '600',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const arrowText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 6px',
  display: 'inline',
};

const moverCard = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  marginBottom: '8px',
  padding: '12px 16px',
};

const moverMain = {
  width: '70%',
};

const countyText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '2px 0 0 0',
};

const moverStatus = {
  textAlign: 'right' as const,
  verticalAlign: 'middle' as const,
};

const operatorRow = {
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '8px',
  paddingBottom: '8px',
};

const operatorLink = {
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
};

const operatorCountColumn = {
  textAlign: 'right' as const,
};

const operatorCountText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const emptySection = {
  padding: '48px 40px',
  textAlign: 'center' as const,
};

const emptyText = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const emptySubtext = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const ctaSection = {
  padding: '24px 40px 16px 40px',
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
};

const secondaryCtaSection = {
  padding: '0 40px 24px 40px',
  textAlign: 'center' as const,
};

const secondaryLink = {
  color: '#6b7280',
  fontSize: '14px',
  textDecoration: 'none',
};

const footer = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px 0',
};

const footerSubtext = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 12px 0',
};

const unsubscribeLink = {
  color: '#9ca3af',
  fontSize: '12px',
  textDecoration: 'underline',
};

export default WeeklyDigestEmail;
