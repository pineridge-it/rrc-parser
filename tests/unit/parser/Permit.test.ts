import { Permit } from '../../src/models/Permit';
import { DaPermitRecord, DaRootRecord } from '../../src/types/permit';

describe('Permit', () => {
  let permit: Permit;

  beforeEach(() => {
    permit = new Permit('12345');
  });

  describe('constructor', () => {
    it('should create a permit with the correct permit number', () => {
      expect(permit.permitNumber).toBe('12345');
    });

    it('should initialize all child record arrays as empty', () => {
      expect(permit.dafield).toEqual([]);
      expect(permit.dalease).toEqual([]);
      expect(permit.dasurvey).toEqual([]);
      expect(permit.dacanres).toEqual([]);
      expect(permit.daareas).toEqual([]);
      expect(permit.daremarks).toEqual([]);
      expect(permit.daareares).toEqual([]);
      expect(permit.daaddress).toEqual([]);
    });

    it('should initialize single records as null', () => {
      expect(permit.daroot).toBeNull();
      expect(permit.dapermit).toBeNull();
      expect(permit.gis_surface).toBeNull();
      expect(permit.gis_bottomhole).toBeNull();
    });
  });

  describe('addChildRecord', () => {
    it('should add a single record correctly', () => {
      const rootRecord: DaRootRecord = {
        segment: '01',
        permit_number: '12345',
        operator_name: 'TEST OPERATOR'
      };

      permit.addChildRecord('daroot', rootRecord);
      expect(permit.daroot).toEqual(rootRecord);
    });

    it('should add records to array collections correctly', () => {
      const fieldRecord = {
        segment: '03',
        field_number: 'F001',
        field_name: 'TEST FIELD'
      };

      permit.addChildRecord('dafield', fieldRecord);
      expect(permit.dafield).toHaveLength(1);
      expect(permit.dafield[0]).toEqual(fieldRecord);
    });

    it('should handle multiple records in array collections', () => {
      const fieldRecord1 = {
        segment: '03',
        field_number: 'F001',
        field_name: 'TEST FIELD 1'
      };

      const fieldRecord2 = {
        segment: '03',
        field_number: 'F002',
        field_name: 'TEST FIELD 2'
      };

      permit.addChildRecord('dafield', fieldRecord1);
      permit.addChildRecord('dafield', fieldRecord2);
      
      expect(permit.dafield).toHaveLength(2);
      expect(permit.dafield[0]).toEqual(fieldRecord1);
      expect(permit.dafield[1]).toEqual(fieldRecord2);
    });
  });

  describe('hasRecord', () => {
    it('should return false for empty single records', () => {
      expect(permit.hasRecord('daroot')).toBe(false);
      expect(permit.hasRecord('dapermit')).toBe(false);
    });

    it('should return true for populated single records', () => {
      const rootRecord: DaRootRecord = {
        segment: '01',
        permit_number: '12345'
      };
      
      permit.addChildRecord('daroot', rootRecord);
      expect(permit.hasRecord('daroot')).toBe(true);
    });

    it('should return false for empty array collections', () => {
      expect(permit.hasRecord('dafield')).toBe(false);
      expect(permit.hasRecord('dalease')).toBe(false);
    });

    it('should return true for populated array collections', () => {
      const fieldRecord = {
        segment: '03',
        field_number: 'F001'
      };
      
      permit.addChildRecord('dafield', fieldRecord);
      expect(permit.hasRecord('dafield')).toBe(true);
    });
  });

  describe('getRecordCount', () => {
    it('should return 0 for empty single records', () => {
      expect(permit.getRecordCount('daroot')).toBe(0);
      expect(permit.getRecordCount('dapermit')).toBe(0);
    });

    it('should return 1 for populated single records', () => {
      const rootRecord: DaRootRecord = {
        segment: '01',
        permit_number: '12345'
      };
      
      permit.addChildRecord('daroot', rootRecord);
      expect(permit.getRecordCount('daroot')).toBe(1);
    });

    it('should return 0 for empty array collections', () => {
      expect(permit.getRecordCount('dafield')).toBe(0);
      expect(permit.getRecordCount('dalease')).toBe(0);
    });

    it('should return correct count for populated array collections', () => {
      const fieldRecord1 = {
        segment: '03',
        field_number: 'F001'
      };

      const fieldRecord2 = {
        segment: '03',
        field_number: 'F002'
      };

      permit.addChildRecord('dafield', fieldRecord1);
      permit.addChildRecord('dafield', fieldRecord2);
      
      expect(permit.getRecordCount('dafield')).toBe(2);
    });
  });

  describe('toObject', () => {
    it('should return a plain object representation of the permit', () => {
      const rootRecord: DaRootRecord = {
        segment: '01',
        permit_number: '12345',
        operator_name: 'TEST OPERATOR'
      };

      const permitRecord: DaPermitRecord = {
        segment: '02',
        permit_number: '12345',
        well_number: 'WELL001'
      };

      const fieldRecord = {
        segment: '03',
        field_number: 'F001',
        field_name: 'TEST FIELD'
      };

      permit.addChildRecord('daroot', rootRecord);
      permit.addChildRecord('dapermit', permitRecord);
      permit.addChildRecord('dafield', fieldRecord);

      const obj = permit.toObject();
      
      expect(obj.daroot).toEqual(rootRecord);
      expect(obj.dapermit).toEqual(permitRecord);
      expect(obj.dafield).toEqual([fieldRecord]);
      expect(obj.dalease).toEqual([]);
    });
  });

  describe('getSummary', () => {
    it('should return a formatted summary string', () => {
      const fieldRecord1 = {
        segment: '03',
        field_number: 'F001'
      };

      const fieldRecord2 = {
        segment: '03',
        field_number: 'F002'
      };

      const leaseRecord = {
        segment: '04',
        lease_number: 'L001'
      };

      const surveyRecord = {
        segment: '05',
        survey_name: 'SURVEY001'
      };

      permit.addChildRecord('dafield', fieldRecord1);
      permit.addChildRecord('dafield', fieldRecord2);
      permit.addChildRecord('dalease', leaseRecord);
      permit.addChildRecord('dasurvey', surveyRecord);

      const summary = permit.getSummary();
      expect(summary).toBe('Permit 12345: 2 fields, 1 leases, 1 surveys');
    });
  });
});