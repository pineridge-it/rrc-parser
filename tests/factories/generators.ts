/**
 * Test Data Generators
 * 
 * Provides realistic data generators for Texas RRC permit testing.
 * All generators produce valid, realistic data that passes validators.
 */

import { faker } from '@faker-js/faker';

// ============================================================================
// Texas RRC Constants
// ============================================================================

export const TEXAS_COUNTIES = [
  'Midland', 'Martin', 'Howard', 'Reeves', 'Upton',
  'Glasscock', 'Irion', 'Crockett', 'Pecos', 'Terrell',
  'Ward', 'Crane', 'Ector', 'Andrews', 'Loving',
  'Winkler', 'Ector', 'Midland', 'Regan', 'Upton',
  'Culberson', 'Jeff Davis', 'Presidio', 'Brewster', 'Pecos',
  'Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis',
  'Collin', 'Hidalgo', 'El Paso', 'Fort Bend', 'Denton',
  'Montgomery', 'Williamson', 'Cameron', 'Nueces', 'Brazoria'
] as const;

export const OPERATORS = [
  'Pioneer Natural Resources',
  'Diamondback Energy',
  'ConocoPhillips',
  'EOG Resources',
  'ExxonMobil',
  'Chevron',
  'Occidental Petroleum',
  'Devon Energy',
  'Marathon Oil',
  'Apache Corporation',
  'BP America',
  'Shell Oil Company',
  'Hunt Oil Company',
  'Cimarex Energy',
  'Parsley Energy',
  'Laredo Petroleum',
  'Callon Petroleum',
  'Matador Resources',
  'Energen Resources',
  'Clayton Williams Energy'
] as const;

export const WELL_TYPES = ['OIL', 'GAS', 'INJECTION', 'DISPOSAL', 'WATER SUPPLY'] as const;

export const DISTRICTS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'] as const;

export const DRILL_TYPES = ['VERTICAL', 'HORIZONTAL', 'DIRECTIONAL', 'DEVIATED'] as const;

export const FORMATIONS = [
  'Spraberry', 'Wolfcamp', 'Bone Spring', 'Avalon', 'Delaware',
  'Barnett', 'Eagle Ford', 'Haynesville', 'Permian', 'Granite Wash'
] as const;

// ============================================================================
// ID Generators
// ============================================================================

export function randomId(length: number = 8): string {
  return faker.string.alphanumeric({ length, casing: 'lower' });
}

export function randomPermitNumber(): string {
  const year = faker.number.int({ min: 2020, max: 2024 });
  const sequence = faker.number.int({ min: 1000, max: 99999 });
  return `P-${year}-${sequence}`;
}

export function randomApiNumber(): string {
  const countyCode = faker.number.int({ min: 1, max: 999 }).toString().padStart(3, '0');
  const wellNumber = faker.number.int({ min: 1, max: 99999 }).toString().padStart(5, '0');
  return `42-${countyCode}-${wellNumber}`;
}

export function randomLeaseId(): string {
  return faker.number.int({ min: 10000, max: 999999 }).toString();
}

export function randomWellNumber(): string {
  return faker.number.int({ min: 1, max: 99 }).toString();
}

// ============================================================================
// Location Generators
// ============================================================================

export function randomTexasCounty(): string {
  return faker.helpers.arrayElement(TEXAS_COUNTIES);
}

export function randomDistrict(): string {
  return faker.helpers.arrayElement(DISTRICTS);
}

export function randomTexasLatitude(): number {
  // Texas latitudes: 25.8 to 36.5
  return faker.number.float({ min: 25.8, max: 36.5, fractionDigits: 6 });
}

export function randomTexasLongitude(): number {
  // Texas longitudes: -106.6 to -93.5
  return faker.number.float({ min: -106.6, max: -93.5, fractionDigits: 6 });
}

export function randomSurfaceLocation(): { latitude: number; longitude: number } {
  return {
    latitude: randomTexasLatitude(),
    longitude: randomTexasLongitude()
  };
}

export function randomAbstract(): string {
  return faker.number.int({ min: 1, max: 9999 }).toString();
}

export function randomSurvey(): string {
  const block = faker.string.alpha({ length: 1, casing: 'upper' });
  const section = faker.number.int({ min: 1, max: 99 });
  return `${block}-${section}`;
}

// ============================================================================
// Operator Generators
// ============================================================================

export function randomOperator(): string {
  return faker.helpers.arrayElement(OPERATORS);
}

export function randomOperatorCode(): string {
  return faker.number.int({ min: 1000, max: 99999 }).toString();
}

export function randomOperatorNumber(): string {
  return faker.number.int({ min: 100000, max: 999999 }).toString();
}

// ============================================================================
// Well Generators
// ============================================================================

export function randomWellType(): typeof WELL_TYPES[number] {
  return faker.helpers.arrayElement(WELL_TYPES);
}

export function randomDrillType(): typeof DRILL_TYPES[number] {
  return faker.helpers.arrayElement(DRILL_TYPES);
}

export function randomFormation(): string {
  return faker.helpers.arrayElement(FORMATIONS);
}

export function randomLeaseName(): string {
  const prefixes = ['Big', 'Little', 'North', 'South', 'East', 'West', 'Upper', 'Lower'];
  const names = ['Spraberry', 'Wolfcamp', 'Delaware', 'Midland', 'Eagle', 'Cedar', 'Oak', 'Pine'];
  const suffixes = ['Unit', 'Lease', 'Ranch', 'Field', 'Prospect'];
  
  return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(names)} ${faker.helpers.arrayElement(suffixes)}`;
}

export function randomWellName(): string {
  const lease = randomLeaseName();
  const wellNum = randomWellNumber();
  return `${lease} #${wellNum}`;
}

// ============================================================================
// Date Generators
// ============================================================================

export function randomPastDate(yearsBack: number = 2): Date {
  return faker.date.past({ years: yearsBack });
}

export function randomRecentDate(daysBack: number = 30): Date {
  return faker.date.recent({ days: daysBack });
}

export function randomFutureDate(yearsForward: number = 1): Date {
  return faker.date.future({ years: yearsForward });
}

export function randomDateBetween(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end });
}

export function randomDateRange(): { start: Date; end: Date } {
  const start = randomPastDate();
  const end = new Date(start.getTime() + faker.number.int({ min: 1, max: 365 }) * 24 * 60 * 60 * 1000);
  return { start, end };
}

// ============================================================================
// Measurement Generators
// ============================================================================

export function randomDepth(): number {
  // Typical well depths in feet
  return faker.number.int({ min: 5000, max: 25000 });
}

export function randomElevation(): number {
  // Surface elevation in feet
  return faker.number.int({ min: 1000, max: 5000 });
}

export function randomAcres(): number {
  return faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
}

export function randomDistance(): number {
  // Distance in feet
  return faker.number.int({ min: 100, max: 10000 });
}

// ============================================================================
// Status Generators
// ============================================================================

export function randomPermitStatus(): 'PENDING' | 'APPROVED' | 'ISSUED' | 'EXPIRED' | 'CANCELLED' {
  return faker.helpers.arrayElement(['PENDING', 'APPROVED', 'ISSUED', 'EXPIRED', 'CANCELLED']);
}

export function randomCompletionStatus(): 'DRILLING' | 'COMPLETED' | 'PRODUCING' | 'SHUT_IN' | 'PA' {
  return faker.helpers.arrayElement(['DRILLING', 'COMPLETED', 'PRODUCING', 'SHUT_IN', 'PA']);
}

// ============================================================================
// User/Workspace Generators
// ============================================================================

export function randomUserRole(): 'admin' | 'member' | 'viewer' {
  return faker.helpers.arrayElement(['admin', 'member', 'viewer']);
}

export function randomWorkspacePlan(): 'free' | 'pro' | 'enterprise' {
  return faker.helpers.arrayElement(['free', 'pro', 'enterprise']);
}

export function randomNotificationChannel(): 'email' | 'in-app' | 'sms' {
  return faker.helpers.arrayElement(['email', 'in-app', 'sms']);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function randomInt(min: number, max: number): number {
  return faker.number.int({ min, max });
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return faker.number.float({ min, max, fractionDigits: decimals });
}

export function randomBoolean(): boolean {
  return faker.datatype.boolean();
}

export function randomArrayElement<T>(array: readonly T[]): T {
  return faker.helpers.arrayElement(array as T[]);
}

export function randomArrayElements<T>(array: readonly T[], count: number): T[] {
  return faker.helpers.arrayElements(array as T[], count);
}

export function randomString(length: number = 10): string {
  return faker.string.alphanumeric({ length });
}

export function randomParagraph(): string {
  return faker.lorem.paragraph();
}

export function randomSentence(): string {
  return faker.lorem.sentence();
}

export function randomWords(count: number = 3): string {
  return faker.lorem.words(count);
}
