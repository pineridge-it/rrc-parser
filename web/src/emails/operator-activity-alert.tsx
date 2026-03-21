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

interface OperatorActivityAlertEmailProps {
  operatorName: string;
  county?: string;
  formation?: string;
  newPermitCount: number;
  permits: Array<{
    permitNumber: string;
    leaseName?: string;
    county?: string;
    formation?: string;
    depth?: number;
    status?: string;
    filedDate?: string;
  }>;
  workspaceName: string;
  operatorDetailUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
}

export const OperatorActivityAlertEmail: React.FC<OperatorActivityAlertEmailProps> = ({
  operatorName,
  county,
  formation,
  newPermitCount,
  permits,
  workspaceName,
  operatorDetailUrl,
  preferencesUrl,
  unsubscribeUrl,
}) => {
  const previewText = `${operatorName} filed ${newPermitCount} new permit${newPermitCount !== 1 ? 's' : ''}${county ? ` in ${county} County` : ''}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading as="h1" style={logo}>
              RRC Monitor
            </Heading>
            <Text style={headerLabel}>Operator Activity Alert</Text>
          </Section>

          <Hr style={divider} />

          <Section style={hero}>
            <Text style={heroText}>
              {operatorName} filed {newPermitCount} new permit{newPermitCount !== 1 ? 's' : ''}{county ? ` in ${county} County` : ''}
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={content}>
            <Text style={paragraph}>
              We're notifying you because you're watching {operatorName} for new permit activity{county ? ` in ${county} County` : ''}.
            </Text>

            {formation && (
              <Text style={paragraph}>
                Filtered to {formation} formation.
              </Text>
            )}

            <Text style={paragraph}>
              Here are the details of the new permits:
            </Text>

            <Section style={permitTable}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={tableHeader}>API Number</th>
                    <th style={tableHeader}>Lease Name</th>
                    <th style={tableHeader}>County</th>
                    <th style={tableHeader}>Formation</th>
                    <th style={tableHeader}>Depth</th>
                    <th style={tableHeader}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map((permit, index) => (
                    <tr key={index} style={tableRow}>
                      <td style={tableCell}>{permit.permitNumber}</td>
                      <td style={tableCell}>{permit.leaseName || 'N/A'}</td>
                      <td style={tableCell}>{permit.county || 'N/A'}</td>
                      <td style={tableCell}>{permit.formation || 'N/A'}</td>
                      <td style={tableCell}>{permit.depth ? `${permit.depth}'` : 'N/A'}</td>
                      <td style={tableCell}>{permit.status || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section style={buttonContainer}>
              <Button
                href={operatorDetailUrl}
                style={button}
              >
                View Full Operator Profile
              </Button>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              This alert was sent to {workspaceName}. 
              You can <Link href={preferencesUrl} style={footerLink}>manage your alert preferences</Link> or{' '}
              <Link href={unsubscribeUrl} style={footerLink}>unsubscribe</Link>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const header = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#4f46e5',
  margin: '0',
};

const headerLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0 0 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const hero = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const heroText = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const content = {
  padding: '0 20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '16px 0',
};

const permitTable = {
  margin: '24px 0',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableHeader = {
  padding: '12px',
  textAlign: 'left' as const,
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
};

const tableRow = {
  borderBottom: '1px solid #e5e7eb',
};

const tableCell = {
  padding: '12px',
  fontSize: '14px',
  color: '#374151',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const footerLink = {
  color: '#4f46e5',
  textDecoration: 'underline',
};