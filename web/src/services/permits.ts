// services/permits.ts
import { Permit } from '@/types/permit';

// Mock data for development
const MOCK_PERMITS: Permit[] = [
  {
    id: '1',
    permit_number: '1234567890',
    permit_type: 'Drilling',
    operator_name: 'Sample Operator Inc.',
    operator_number: 'OP-12345',
    lease_name: 'Sample Lease',
    well_number: 'W-67890',
    county: 'Sample County',
    field_name: 'Sample Field',
    district: 'Sample District',
    status: 'Approved',
    filed_date: '2026-01-15',
    updated_date: '2026-01-20',
    api_number: '1234567890',
  },
  {
    id: '2',
    permit_number: '0987654321',
    permit_type: 'Recompletion',
    operator_name: 'Another Operator LLC',
    operator_number: 'OP-54321',
    lease_name: 'Another Lease',
    well_number: 'W-09876',
    county: 'Another County',
    field_name: 'Another Field',
    district: 'Another District',
    status: 'Pending',
    filed_date: '2026-02-01',
    updated_date: '2026-02-05',
    api_number: '0987654321',
  },
];

export async function fetchPermitByApiNumber(apiNumber: string): Promise<Permit> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find permit in mock data
  const foundPermit = MOCK_PERMITS.find(p => p.api_number === apiNumber);
  
  if (foundPermit) {
    return foundPermit;
  }
  
  // In a real implementation, we would call an API endpoint:
  // const response = await fetch(`/api/permits/${apiNumber}`);
  // if (!response.ok) {
  //   throw new Error('Failed to fetch permit data');
  // }
  // const data = await response.json();
  // return data;
  
  throw new Error('Permit not found');
}