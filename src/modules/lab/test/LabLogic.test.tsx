import { describe, it, expect } from 'vitest';

// Logic to test (extracted for pure unit testing of business rules in UI)
const determineStatus = (value: number, range: { min: number, max: number, cMin: number, cMax: number }) => {
    if (value <= range.cMin) return 'CRITICAL_LOW';
    if (value >= range.cMax) return 'CRITICAL_HIGH';
    if (value < range.min) return 'LOW';
    if (value > range.max) return 'HIGH';
    return 'NORMAL';
};

describe('Laboratory Business Logic - UI Layer', () => {

    it('Flow: Should correctly flag a critical Hemoglobin value (5.0)', () => {
        const range = { min: 13, max: 17, cMin: 7, cMax: 20 };
        const status = determineStatus(5, range);
        
        expect(status).toBe('CRITICAL_LOW');
    });

    it('Flow: Should correctly flag a high value (18.5)', () => {
        const range = { min: 13, max: 17, cMin: 7, cMax: 20 };
        const status = determineStatus(18.5, range);
        
        expect(status).toBe('HIGH');
    });

    it('Flow: Should identify a normal value (14.2)', () => {
        const range = { min: 13, max: 17, cMin: 7, cMax: 20 };
        const status = determineStatus(14.2, range);
        
        expect(status).toBe('NORMAL');
    });

});
