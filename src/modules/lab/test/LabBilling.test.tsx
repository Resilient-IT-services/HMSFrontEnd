import { describe, it, expect, vi } from 'vitest';

// Business Logic for UI: Calculate Bill Summary
const calculateBill = (
    basePrice: number, 
    discount: number, 
    taxComponents: { name: string, rate: number }[]
) => {
    const taxableAmount = Math.max(0, basePrice - discount);
    let totalTax = 0;
    const breakdown = taxComponents.map(tax => {
        const amount = (taxableAmount * tax.rate) / 100;
        totalTax += amount;
        return { name: tax.name, amount: amount.toFixed(2) };
    });

    return {
        taxableAmount: taxableAmount.toFixed(2),
        totalTax: totalTax.toFixed(2),
        grandTotal: (taxableAmount + totalTax).toFixed(2),
        breakdown
    };
};

describe('Laboratory Billing UI Logic', () => {

    it('Flow: Should calculate correct bill for CBC with CGST+SGST (Intra-state)', () => {
        const basePrice = 300;
        const discount = 0;
        const taxComponents = [
            { name: 'CGST', rate: 2.5 },
            { name: 'SGST', rate: 2.5 }
        ];

        const bill = calculateBill(basePrice, discount, taxComponents);

        expect(bill.taxableAmount).toBe('300.00');
        expect(bill.totalTax).toBe('15.00');
        expect(bill.grandTotal).toBe('315.00');
        expect(bill.breakdown).toContainEqual({ name: 'CGST', amount: '7.50' });
    });

    it('Flow: Should calculate correct bill for Emergency test with IGST (Inter-state)', () => {
        const emergencyPrice = 500;
        const discount = 50;
        const taxComponents = [
            { name: 'IGST', rate: 5 }
        ];

        const bill = calculateBill(emergencyPrice, discount, taxComponents);

        expect(bill.taxableAmount).toBe('450.00'); // 500 - 50
        expect(bill.totalTax).toBe('22.50'); // 5% of 450
        expect(bill.grandTotal).toBe('472.50');
    });

});
