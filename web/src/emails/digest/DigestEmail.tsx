import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface SavedSearch {
  id: string;
  name: string;
  new_permits: number;
}

interface StatusChange {
  api_number: string;
  old_status: string;
  new_status: string;
  filed_date: string;
  operator_name: string;
  lease_name: string;
  county: string;
}

interface NewOperator {
  operator_name: string;
  first_permit_date: string;
  permit_count: number;
}

interface DigestData {
  period_start: string;
  period_end: string;
  saved_searches: SavedSearch[];
  status_changes: StatusChange[];
  top_movers: StatusChange[];
  new_operators: NewOperator[];
  summary_stats: {
    total_new_permits: number;
    total_status_changes: number;
    total_new_operators: number;
  };
}

interface DigestEmailProps {
  username: string;
  data: DigestData;
  appUrl: string;
  mapImageUrl?: string;
}

export default function DigestEmail({
  username = 'User',
  data,
  appUrl = 'https://example.com',
  mapImageUrl,
}: DigestEmailProps) {
  const previewText = `Your weekly permit digest - ${data.summary_stats.total_new_permits} new permits, ${data.summary_stats.total_status_changes} status changes`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            {/* Header */}
            <Section className="mt-[32px]">
              <Img
                src={`${appUrl}/logo.png`}
                width="40"
                height="37"
                alt="PermitWatch"
                className="my-0 mx-auto"
              />
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Weekly Permit Digest
              </Heading>
              <Text className="text-black text-[14px] leading-[24px] text-center">
                Hello {username}, here's your permit activity summary for {formatDate(data.period_start)} to {formatDate(data.period_end)}.
              </Text>
            </Section>

            {/* Summary Stats */}
            <Section className="bg-gray-50 rounded-lg p-4 mb-6">
              <Text className="text-[16px] font-semibold text-center m-0">
                This Week's Activity
              </Text>
              <div className="flex justify-around mt-2">
                <div className="text-center">
                  <Text className="text-[24px] font-bold text-blue-600 m-0">
                    {data.summary_stats.total_new_permits}
                  </Text>
                  <Text className="text-[12px] text-gray-600 m-0">New Permits</Text>
                </div>
                <div className="text-center">
                  <Text className="text-[24px] font-bold text-green-600 m-0">
                    {data.summary_stats.total_status_changes}
                  </Text>
                  <Text className="text-[12px] text-gray-600 m-0">Status Changes</Text>
                </div>
                <div className="text-center">
                  <Text className="text-[24px] font-bold text-purple-600 m-0">
                    {data.summary_stats.total_new_operators}
                  </Text>
                  <Text className="text-[12px] text-gray-600 m-0">New Operators</Text>
                </div>
              </div>
            </Section>

            {/* Map Image */}
            {mapImageUrl && (
              <Section className="mb-6">
                <Img
                  src={mapImageUrl}
                  alt="County activity heatmap"
                  width="100%"
                  className="rounded-lg"
                />
                <Text className="text-[12px] text-gray-600 text-center mt-1">
                  Activity heatmap for your watched areas
                </Text>
              </Section>
            )}

            {/* Saved Searches */}
            {data.saved_searches.length > 0 && (
              <Section className="mb-6">
                <Heading className="text-[16px] font-semibold text-gray-900 mb-2">
                  Saved Search Results
                </Heading>
                {data.saved_searches.map((search) => (
                  <div key={search.id} className="border-b border-gray-200 py-3">
                    <div className="flex justify-between items-center">
                      <Text className="text-[14px] font-medium text-gray-900 m-0">
                        {search.name}
                      </Text>
                      <Text className="text-[14px] font-semibold text-blue-600 m-0">
                        {search.new_permits} new
                      </Text>
                    </div>
                    <Button
                      className="bg-blue-600 rounded text-white text-[12px] font-semibold no-underline text-center mt-2"
                      href={`${appUrl}/search/${search.id}`}
                    >
                      View Results
                    </Button>
                  </div>
                ))}
              </Section>
            )}

            {/* Status Changes */}
            {data.status_changes.length > 0 && (
              <Section className="mb-6">
                <Heading className="text-[16px] font-semibold text-gray-900 mb-2">
                  Recent Status Changes
                </Heading>
                {data.status_changes.slice(0, 5).map((change, index) => (
                  <div key={index} className="border-b border-gray-200 py-3">
                    <Text className="text-[14px] font-medium text-gray-900 m-0">
                      {change.operator_name} - {change.lease_name}
                    </Text>
                    <Text className="text-[12px] text-gray-600 m-0">
                      {change.county} • {formatShortDate(change.filed_date)}
                    </Text>
                    <div className="flex items-center mt-1">
                      <span className="text-[12px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {change.old_status || 'N/A'}
                      </span>
                      <span className="mx-2 text-[12px]">→</span>
                      <span className="text-[12px] bg-green-100 text-green-800 px-2 py-1 rounded">
                        {change.new_status}
                      </span>
                    </div>
                    <Button
                      className="bg-blue-600 rounded text-white text-[12px] font-semibold no-underline text-center mt-2"
                      href={`${appUrl}/permits/${change.api_number}`}
                    >
                      View Permit
                    </Button>
                  </div>
                ))}
              </Section>
            )}

            {/* Top Movers */}
            {data.top_movers.length > 0 && (
              <Section className="mb-6">
                <Heading className="text-[16px] font-semibold text-gray-900 mb-2">
                  Top Movers
                </Heading>
                {data.top_movers.slice(0, 3).map((mover, index) => (
                  <div key={index} className="border-b border-gray-200 py-3">
                    <Text className="text-[14px] font-medium text-gray-900 m-0">
                      {mover.operator_name}
                    </Text>
                    <Text className="text-[12px] text-gray-600 m-0">
                      {mover.lease_name} • {mover.county}
                    </Text>
                    <Text className="text-[12px] text-gray-600 m-0">
                      {mover.api_number}
                    </Text>
                    <div className="flex items-center mt-1">
                      <span className="text-[12px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {mover.old_status || 'N/A'}
                      </span>
                      <span className="mx-2 text-[12px]">→</span>
                      <span className="text-[12px] bg-green-100 text-green-800 px-2 py-1 rounded">
                        {mover.new_status}
                      </span>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* New Operators */}
            {data.new_operators.length > 0 && (
              <Section className="mb-6">
                <Heading className="text-[16px] font-semibold text-gray-900 mb-2">
                  New Operators
                </Heading>
                {data.new_operators.slice(0, 5).map((operator, index) => (
                  <div key={index} className="border-b border-gray-200 py-3">
                    <Text className="text-[14px] font-medium text-gray-900 m-0">
                      {operator.operator_name}
                    </Text>
                    <Text className="text-[12px] text-gray-600 m-0">
                      First permit: {formatShortDate(operator.first_permit_date)} • {operator.permit_count} permits
                    </Text>
                  </div>
                ))}
              </Section>
            )}

            {/* Footer */}
            <Section className="mt-6">
              <Hr />
              <Text className="text-[12px] text-gray-600 text-center">
                You're receiving this email because you subscribed to weekly permit digests.
              </Text>
              <Text className="text-[12px] text-gray-600 text-center">
                <Link href={`${appUrl}/settings/digest`} className="text-blue-600 underline">
                  Manage your digest preferences
                </Link>
                {' • '}
                <Link href={`${appUrl}/settings/notifications`} className="text-blue-600 underline">
                  Notification settings
                </Link>
              </Text>
              <Text className="text-[12px] text-gray-600 text-center mt-4">
                © {new Date().getFullYear()} PermitWatch. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}