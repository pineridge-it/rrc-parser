/**
 * Permit Factory
 * 
 * Generates realistic permit data for testing.
 * All generated permits pass validation and represent realistic Texas RRC permits.
 */

import {
  randomId,
  randomPermitNumber,
  randomApiNumber,
  randomLeaseId,
  randomWellNumber,
  randomTexasCounty,
  randomDistrict,
  randomTexasLatitude,
  randomTexasLongitude,
  randomSurfaceLocation,
  randomAbstract,
  randomSurvey,
  randomOperator,
  randomOperatorCode,
  randomOperatorNumber,
  randomWellType,
  randomDrillType,
  randomFormation,
  randomLeaseName,
  randomWellName,
  randomPastDate,
  randomRecentDate,
  randomDateBetween,
  randomDepth,
  randomElevation,
  randomAcres,
  randomDistance,
  randomPermitStatus,
  randomCompletionStatus,
  randomInt,
  randomBoolean,
} from './generators';

// ============================================================================
// Types
// ============================================================================

export interface PermitData {
  id?: string;
  permitNumber: string;
  apiNumber: string;
  leaseId?: string;
  leaseName: string;
  wellName: string;
  wellNumber: string;
  operatorName: string;
  operatorCode: string;
  operatorNumber: string;
  county: string;
  district: string;
  wellType: string;
  drillType: string;
  formation: string;
  status: string;
  issuedDate: Date;
  effectiveDate?: Date;
  expirationDate?: Date;
  surfaceLocation: {
    latitude: number;
    longitude: number;
  };
  abstract: string;
  survey: string;
  block: string;
  section: string;
  totalDepth: number;
  elevation: number;
  acres: number;
  distances: {
    nearestWell: number;
    nearestLeaseLine: number;
    nearestSectionLine: number;
  };
  completionStatus: string;
  isHorizontal: boolean;
  isDirectional: boolean;
  lateralLength?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PermitOverrides {
  [key: string]: unknown;
}

// ============================================================================
// Permit Factory
// ============================================================================

export class PermitFactory {
  /**
   * Create a single permit with realistic defaults
   */
  static create(overrides: Partial<PermitData> = {}): PermitData {
    const county = overrides.county || randomTexasCounty();
    const district = overrides.district || randomDistrict();
    const surfaceLoc = overrides.surfaceLocation || randomSurfaceLocation();
    const issuedDate = overrides.issuedDate || randomPastDate();
    const wellType = overrides.wellType || randomWellType();
    const drillType = overrides.drillType || randomDrillType();
    
    return {
      id: randomId(),
      permitNumber: randomPermitNumber(),
      apiNumber: randomApiNumber(),
      leaseId: randomLeaseId(),
      leaseName: randomLeaseName(),
      wellName: randomWellName(),
      wellNumber: randomWellNumber(),
      operatorName: randomOperator(),
      operatorCode: randomOperatorCode(),
      operatorNumber: randomOperatorNumber(),
      county,
      district,
      wellType,
      drillType,
      formation: randomFormation(),
      status: randomPermitStatus(),
      issuedDate,
      effectiveDate: overrides.effectiveDate ?? randomRecentDate(30),
      expirationDate: overrides.expirationDate ?? new Date(issuedDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      surfaceLocation: surfaceLoc,
      abstract: randomAbstract(),
      survey: randomSurvey(),
      block: randomInt(1, 100).toString(),
      section: randomInt(1, 99).toString(),
      totalDepth: randomDepth(),
      elevation: randomElevation(),
      acres: randomAcres(),
      distances: {
        nearestWell: randomDistance(),
        nearestLeaseLine: randomDistance(),
        nearestSectionLine: randomDistance(),
      },
      completionStatus: randomCompletionStatus(),
      isHorizontal: drillType === 'HORIZONTAL',
      isDirectional: drillType === 'DIRECTIONAL' || drillType === 'DEVIATED',
      lateralLength: drillType === 'HORIZONTAL' ? randomInt(5000, 15000) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create multiple permits
   */
  static createMany(count: number, overrides?: Partial<PermitData>): PermitData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a permit in a specific county
   */
  static inCounty(county: string, overrides?: Partial<PermitData>): PermitData {
    return this.create({ county, ...overrides });
  }

  /**
   * Create permits all in the same county
   */
  static manyInCounty(count: number, county: string, overrides?: Partial<PermitData>): PermitData[] {
    return Array.from({ length: count }, () => this.inCounty(county, overrides));
  }

  /**
   * Create an oil well permit
   */
  static oil(overrides?: Partial<PermitData>): PermitData {
    return this.create({ wellType: 'OIL', ...overrides });
  }

  /**
   * Create a gas well permit
   */
  static gas(overrides?: Partial<PermitData>): PermitData {
    return this.create({ wellType: 'GAS', ...overrides });
  }

  /**
   * Create an injection well permit
   */
  static injection(overrides?: Partial<PermitData>): PermitData {
    return this.create({ wellType: 'INJECTION', ...overrides });
  }

  /**
   * Create a horizontal well permit
   */
  static horizontal(overrides?: Partial<PermitData>): PermitData {
    return this.create({ 
      drillType: 'HORIZONTAL', 
      isHorizontal: true,
      lateralLength: randomInt(5000, 15000),
      ...overrides 
    });
  }

  /**
   * Create a permit with specific date range
   */
  static withDateRange(start: Date, end: Date, overrides?: Partial<PermitData>): PermitData {
    return this.create({
      issuedDate: randomDateBetween(start, end),
      ...overrides,
    });
  }

  /**
   * Create a permit for a specific operator
   */
  static forOperator(operatorName: string, overrides?: Partial<PermitData>): PermitData {
    return this.create({ operatorName, ...overrides });
  }

  /**
   * Create a permit with specific API number format
   */
  static withApiNumber(apiNumber: string, overrides?: Partial<PermitData>): PermitData {
    return this.create({ apiNumber, ...overrides });
  }

  /**
   * Create an expired permit
   */
  static expired(overrides?: Partial<PermitData>): PermitData {
    const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    return this.create({
      status: 'EXPIRED',
      issuedDate: pastDate,
      expirationDate: new Date(pastDate.getTime() + 180 * 24 * 60 * 60 * 1000),
      ...overrides,
    });
  }

  /**
   * Create a pending permit
   */
  static pending(overrides?: Partial<PermitData>): PermitData {
    return this.create({
      status: 'PENDING',
      issuedDate: new Date(),
      effectiveDate: undefined,
      ...overrides,
    });
  }

  /**
   * Create a permit with invalid data (for negative testing)
   */
  static invalid(overrides?: Partial<PermitData>): PermitData {
    return this.create({
      apiNumber: 'invalid-api',
      surfaceLocation: { latitude: 999, longitude: 999 },
      ...overrides,
    });
  }

  /**
   * Convert permit to RRC text format (simplified)
   */
  static toRrcFormat(permit: PermitData): string {
    return `
PERMIT NUMBER: ${permit.permitNumber}
API NUMBER: ${permit.apiNumber}
OPERATOR: ${permit.operatorName}
OPERATOR CODE: ${permit.operatorCode}
LEASE NAME: ${permit.leaseName}
WELL NUMBER: ${permit.wellNumber}
COUNTY: ${permit.county}
DISTRICT: ${permit.district}
WELL TYPE: ${permit.wellType}
DRILL TYPE: ${permit.drillType}
FORMATION: ${permit.formation}
STATUS: ${permit.status}
ISSUED DATE: ${permit.issuedDate.toISOString().split('T')[0]}
SURFACE LOCATION:
  LATITUDE: ${permit.surfaceLocation.latitude}
  LONGITUDE: ${permit.surfaceLocation.longitude}
ABSTRACT: ${permit.abstract}
SURVEY: ${permit.survey}
TOTAL DEPTH: ${permit.totalDepth}
ELEVATION: ${permit.elevation}
ACRES: ${permit.acres}
`.trim();
  }

  /**
   * Create permits from RRC-like text (reverse parsing)
   */
  static fromRrcFormat(text: string): Partial<PermitData> {
    const lines = text.split('\n');
    const data: Partial<PermitData> = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.trim()) {
        case 'PERMIT NUMBER':
          data.permitNumber = value;
          break;
        case 'API NUMBER':
          data.apiNumber = value;
          break;
        case 'OPERATOR':
          data.operatorName = value;
          break;
        case 'OPERATOR CODE':
          data.operatorCode = value;
          break;
        case 'LEASE NAME':
          data.leaseName = value;
          break;
        case 'WELL NUMBER':
          data.wellNumber = value;
          break;
        case 'COUNTY':
          data.county = value;
          break;
        case 'DISTRICT':
          data.district = value;
          break;
        case 'WELL TYPE':
          data.wellType = value;
          break;
        case 'DRILL TYPE':
          data.drillType = value;
          break;
        case 'FORMATION':
          data.formation = value;
          break;
        case 'STATUS':
          data.status = value;
          break;
        case 'ISSUED DATE':
          data.issuedDate = new Date(value);
          break;
      }
    });
    
    return data;
  }
}

export default PermitFactory;
