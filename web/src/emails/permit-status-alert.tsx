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
} from '@react-email/components';
import * as React from 'react';

interface PermitStatusAlertEmailProps {
  permitApiNumber: string;
  operatorName: string;
  oldStatus: string;
  newStatus: string;
  county?: string;
  leaseName?: string;
  field?: string;
  formation?: string;
  filedDate?: string;
  latitude?: number;
  longitude?: number;
  workspaceName: string;
  permitDetailUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
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

const getMapboxStaticUrl = (lat?: number, lng?: number, county?: string): string => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) return '';
  
  const coordinates = lat && lng 
    ? `${lng},${lat}`
    : '-99.9,31.5';
  
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+e53e3e(${coordinates})/${coordinates},8,0/400x200?access_token=${mapboxToken}`;
};

export const PermitStatusAlertEmail: React.FC<PermitStatusAlertEmailProps> = ({
  permitApiNumber,
  operatorName,
  oldStatus,
  newStatus,
  county,
  leaseName,
  field,
  formation,
  filedDate,
  latitude,
  longitude,
  workspaceName,
  permitDetailUrl,
  preferencesUrl,
  unsubscribeUrl,
}) => {
  const oldStyle = getStatusStyle(oldStatus);
  const newStyle = getStatusStyle(newStatus);
  const mapUrl = getMapboxStaticUrl(latitude, longitude, county);

  return (
    <Html>
      <Head />
      <Preview>
        {operatorName} permit {permitApiNumber}: {oldStatus} → {newStatus}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading as="h1" style={logo}>
              RRC Monitor
            </Heading>
            <Text style={headerLabel}>Permit Status Alert</Text>
          </Section>

          <Hr style={divider} />

          <Section style={hero}>
            <Text style={permitNumber}>{permitApiNumber}</Text>
            <Text style={operatorNameText}>{operatorName}</Text>
          </Section>

          <Section style={statusSection}>
            <Container style={statusContainer}>
              <Section style={{ ...statusBadge, backgroundColor: oldStyle.bg }}>
                <Text style={{ ...statusText, color: oldStyle.text }}>{oldStatus}</Text>
              </Section>
              <Text style={arrow}>→</Text>
              <Section style={{ ...statusBadge, backgroundColor: newStyle.bg }}>
                <Text style={{ ...statusText, color: newStyle.text }}>{newStatus}</Text>
              </Section>
            </Container>
          </Section>

          {mapUrl && (
            <Section style={mapSection}>
              <Img
                src={mapUrl}
                alt={`Map showing permit location in ${county || 'Texas'}`}
                style={mapImage}
              />
            </Section>
          )}

          <Section style={metadataSection}>
            <Heading as="h2" style={metadataTitle}>Permit Details</Heading>
            {county && <MetadataRow label="County" value={county} />}
            {leaseName && <MetadataRow label="Lease" value={leaseName} />}
            {field && <MetadataRow label="Field" value={field} />}
            {formation && <MetadataRow label="Formation" value={formation} />}
            {filedDate && <MetadataRow label="Filed" value={filedDate} />}
          </Section>

          <Section style={ctaSection}>
            <Button style={primaryButton} href={permitDetailUrl}>
              View Permit Details
            </Button>
          </Section>

          <Section style={secondaryCtaSection}>
            <Link style={secondaryLink} href={preferencesUrl}>
              Manage Alert Preferences
            </Link>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              Sent by {workspaceName} • {new Date().toLocaleDateString()}
            </Text>
            <Link style={unsubscribeLink} href={unsubscribeUrl}>
              Unsubscribe from this alert
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const MetadataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Container style={metadataRow}>
    <Text style={metadataLabel}>{label}</Text>
    <Text style={metadataValue}>{value}</Text>
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
  padding: '0',
};

const header = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};

const headerLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '0',
};

const hero = {
  padding: '32px 40px 24px 40px',
  textAlign: 'center' as const,
};

const permitNumber = {
  color: '#111827',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  letterSpacing: '-0.5px',
};

const operatorNameText = {
  color: '#6b7280',
  fontSize: '16px',
  margin: '0',
};

const statusSection = {
  padding: '0 40px 24px 40px',
};

const statusContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const statusBadge = {
  borderRadius: '6px',
  padding: '8px 16px',
  display: 'inline-block',
};

const statusText = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const arrow = {
  color: '#9ca3af',
  fontSize: '20px',
  margin: '0 16px',
};

const mapSection = {
  padding: '0 40px 24px 40px',
};

const mapImage = {
  borderRadius: '8px',
  width: '100%',
  height: 'auto',
};

const metadataSection = {
  backgroundColor: '#f9fafb',
  padding: '24px 40px',
};

const metadataTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const metadataRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
};

const metadataLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const metadataValue = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const ctaSection = {
  padding: '32px 40px 16px 40px',
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
  padding: '0 40px 32px 40px',
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
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 8px 0',
};

const unsubscribeLink = {
  color: '#9ca3af',
  fontSize: '12px',
  textDecoration: 'underline',
};

export default PermitStatusAlertEmail;
