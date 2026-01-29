import * as crypto from 'crypto';
import { PermitData } from '../../types';

/**
 * Utility functions for generating hashes and ensuring idempotency
 */
export class HashUtils {
  /**
   * Generate a SHA-256 hash of the permit data for change detection
   * @param permitData - The permit data to hash
   * @returns SHA-256 hash string
   */
  static generatePermitHash(permitData: PermitData): string {
    // Sort keys to ensure consistent hashing regardless of property order
    const sortedData = this.sortObjectKeys(permitData);
    const dataString = JSON.stringify(sortedData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate a hash for raw data to detect changes
   * @param rawData - The raw data string to hash
   * @returns SHA-256 hash string
   */
  static generateRawHash(rawData: string): string {
    return crypto.createHash('sha256').update(rawData).digest('hex');
  }

  /**
   * Recursively sort object keys for consistent hashing
   * @param obj - The object to sort
   * @returns A new object with sorted keys
   */
  private static sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedObj: Record<string, any> = {};
    Object.keys(obj).sort().forEach(key => {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    });

    return sortedObj;
  }

  /**
   * Compare two hashes to determine if data has changed
   * @param hash1 - First hash
   * @param hash2 - Second hash
   * @returns True if hashes are identical
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
  }
}