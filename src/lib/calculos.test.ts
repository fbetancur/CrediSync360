/**
 * CrediSync360 V2 - Unit Tests for Pure Functions
 * 
 * Tests for critical calculation functions
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calcularSaldoPendiente,
  distribuirPago,
  generarFechasCuotas,
} from './calculos';
import type { Cuota, Pago } from '../types';

// ============================================================================
// Helper Functions
// ============================================================================

function createCuota(id: string, numero: number, monto: number, fecha: string): Cuota {
  return {
    id,
    tenantId: 'test-tenant',
    creditoId: 'test-credito',
    clienteId: 'test-cliente',
    numero,
    fechaProgramada: fecha,
    montoProgramado: monto,
    createdAt: new Date().toISOString(),
    createdBy: 'test-user',
  };
}

function createPago(id: string, cuotaId: string, monto: number): Pago {
  return {
    id,
    tenantId: 'test-tenant',
    creditoId: 'test-credito',
    cuotaId,
    clienteId: 'test-cliente',
    cobradorId: 'test-cobrador',
    monto,
    fecha: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    createdBy: 'test-user',
  };
}

// ============================================================================
// Unit Tests: calcularSaldoPendiente
// ============================================================================

describe('calcularSaldoPendiente', () => {
  it('should return total when no payments', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos: Pago[] = [];

    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(120);
  });

  it('should return 0 when fully paid', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos = [
      createPago('p1', 'c1', 60),
      createPago('p2', 'c2', 60),
    ];

    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(0);
  });

  it('should return correct balance with partial payment', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos = [createPago('p1', 'c1', 30)];

    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(90);
  });

  it('should handle overpayment gracefully', () => {
    const cuotas = [createCuota('c1', 1, 60, '2025-12-01')];
    const pagos = [createPago('p1', 'c1', 100)];

    // Should not return negative
    expect(calcularSaldoPendiente(cuotas, pagos)).toBe(0);
  });

  it('should handle empty arrays', () => {
    expect(calcularSaldoPendiente([], [])).toBe(0);
  });
});

// ============================================================================
// Unit Tests: distribuirPago
// ============================================================================

describe('distribuirPago', () => {
  it('should pay single installment completely', () => {
    const cuotas = [createCuota('c1', 1, 60, '2025-12-01')];
    const pagos: Pago[] = [];

    const distribucion = distribuirPago(60, cuotas, pagos);

    expect(distribucion).toHaveLength(1);
    expect(distribucion[0]).toEqual({
      cuotaId: 'c1',
      montoPagar: 60,
    });
  });

  it('should pay multiple installments in order', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
      createCuota('c3', 3, 60, '2025-12-03'),
    ];
    const pagos: Pago[] = [];

    const distribucion = distribuirPago(180, cuotas, pagos);

    expect(distribucion).toHaveLength(3);
    expect(distribucion[0].cuotaId).toBe('c1');
    expect(distribucion[1].cuotaId).toBe('c2');
    expect(distribucion[2].cuotaId).toBe('c3');
  });

  it('should handle partial payment on first installment', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos: Pago[] = [];

    const distribucion = distribuirPago(30, cuotas, pagos);

    expect(distribucion).toHaveLength(1);
    expect(distribucion[0]).toEqual({
      cuotaId: 'c1',
      montoPagar: 30,
    });
  });

  it('should pay first installment and partial second', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos: Pago[] = [];

    const distribucion = distribuirPago(110, cuotas, pagos);

    expect(distribucion).toHaveLength(2);
    expect(distribucion[0]).toEqual({ cuotaId: 'c1', montoPagar: 60 });
    expect(distribucion[1]).toEqual({ cuotaId: 'c2', montoPagar: 50 });
  });

  it('should skip already paid installments', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos = [createPago('p1', 'c1', 60)];

    const distribucion = distribuirPago(60, cuotas, pagos);

    expect(distribucion).toHaveLength(1);
    expect(distribucion[0].cuotaId).toBe('c2');
  });

  it('should handle payment with existing partial payment', () => {
    const cuotas = [
      createCuota('c1', 1, 60, '2025-12-01'),
      createCuota('c2', 2, 60, '2025-12-02'),
    ];
    const pagos = [createPago('p1', 'c1', 30)];

    const distribucion = distribuirPago(60, cuotas, pagos);

    expect(distribucion).toHaveLength(2);
    expect(distribucion[0]).toEqual({ cuotaId: 'c1', montoPagar: 30 });
    expect(distribucion[1]).toEqual({ cuotaId: 'c2', montoPagar: 30 });
  });

  it('should return empty array when payment is 0', () => {
    const cuotas = [createCuota('c1', 1, 60, '2025-12-01')];
    const pagos: Pago[] = [];

    const distribucion = distribuirPago(0, cuotas, pagos);

    expect(distribucion).toHaveLength(0);
  });
});

// ============================================================================
// Unit Tests: generarFechasCuotas
// ============================================================================

describe('generarFechasCuotas', () => {
  it('should generate correct number of dates', () => {
    const fechaPrimeraCuota = new Date(2025, 11, 2); // December 2, 2025

    const fechas = generarFechasCuotas(
      fechaPrimeraCuota,
      5,
      'DIARIO',
      false
    );

    expect(fechas).toHaveLength(5);
  });

  it('should generate daily dates correctly', () => {
    const fechaPrimeraCuota = new Date(2025, 11, 2); // December 2, 2025 (month is 0-indexed)

    const fechas = generarFechasCuotas(
      fechaPrimeraCuota,
      3,
      'DIARIO',
      false
    );

    expect(fechas[0]).toBe('2025-12-02');
    expect(fechas[1]).toBe('2025-12-03');
    expect(fechas[2]).toBe('2025-12-04');
  });

  it('should skip Sundays when excluirDomingos is true', () => {
    // 2025-12-06 is Saturday, 2025-12-07 is Sunday
    const fechaPrimeraCuota = new Date(2025, 11, 6); // December 6, 2025

    const fechas = generarFechasCuotas(
      fechaPrimeraCuota,
      3,
      'DIARIO',
      true
    );

    expect(fechas[0]).toBe('2025-12-06'); // Saturday
    expect(fechas[1]).toBe('2025-12-08'); // Monday (skipped Sunday)
    expect(fechas[2]).toBe('2025-12-09'); // Tuesday
  });

  it('should not skip Sundays when excluirDomingos is false', () => {
    const fechaPrimeraCuota = new Date(2025, 11, 6); // December 6, 2025

    const fechas = generarFechasCuotas(
      fechaPrimeraCuota,
      3,
      'DIARIO',
      false
    );

    expect(fechas[0]).toBe('2025-12-06'); // Saturday
    expect(fechas[1]).toBe('2025-12-07'); // Sunday (not skipped)
    expect(fechas[2]).toBe('2025-12-08'); // Monday
  });

  it('should generate weekly dates correctly', () => {
    const fechaPrimeraCuota = new Date(2025, 11, 2); // December 2, 2025

    const fechas = generarFechasCuotas(
      fechaPrimeraCuota,
      3,
      'SEMANAL',
      false
    );

    expect(fechas[0]).toBe('2025-12-02');
    expect(fechas[1]).toBe('2025-12-09');
    expect(fechas[2]).toBe('2025-12-16');
  });

  it('should generate monthly dates correctly', () => {
    const fechaPrimeraCuota = new Date(2025, 11, 2); // December 2, 2025

    const fechas = generarFechasCuotas(
      fechaPrimeraCuota,
      3,
      'MENSUAL',
      false
    );

    expect(fechas[0]).toBe('2025-12-02');
    expect(fechas[1]).toBe('2026-01-01');
    expect(fechas[2]).toBe('2026-01-31');
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property Tests: distribuirPago', () => {
  it('Property 5: Payment distribution correctness', () => {
    // Property 5: Payment Distribution Correctness
    // Validates: Requirements 2.9, 2.10

    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 10000, noNaN: true }), // payment amount
        fc.array(
          fc.record({
            numero: fc.integer({ min: 1, max: 20 }),
            monto: fc.float({ min: 1, max: 1000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ), // installments
        (monto, cuotasData) => {
          // Skip if any values are NaN or invalid
          if (!Number.isFinite(monto) || cuotasData.some(d => !Number.isFinite(d.monto))) {
            return true;
          }

          // Create cuotas from generated data
          const cuotas = cuotasData.map((data, index) =>
            createCuota(`c${index}`, data.numero, data.monto, '2025-12-01')
          );

          const distribucion = distribuirPago(monto, cuotas, []);

          // Sum of distributed amounts should equal payment amount (or less if not enough balance)
          const totalDistribuido = distribucion.reduce(
            (sum, d) => sum + d.montoPagar,
            0
          );
          const saldoTotal = cuotas.reduce((sum, c) => sum + c.montoProgramado, 0);
          const expectedTotal = Math.min(monto, saldoTotal);

          expect(Math.abs(totalDistribuido - expectedTotal)).toBeLessThan(0.01);

          // No negative amounts
          distribucion.forEach((d) => {
            expect(d.montoPagar).toBeGreaterThanOrEqual(0);
          });

          // No installment receives more than its balance
          distribucion.forEach((d) => {
            const cuota = cuotas.find((c) => c.id === d.cuotaId);
            expect(d.montoPagar).toBeLessThanOrEqual(cuota!.montoProgramado + 0.01);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property Tests: calcularSaldoPendiente', () => {
  it('Property 7: Balance calculation consistency', () => {
    // Property 7: Balance Calculation Consistency
    // Validates: Requirements 2.2, 4.9

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            numero: fc.integer({ min: 1, max: 20 }),
            monto: fc.float({ min: 1, max: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            cuotaIndex: fc.integer({ min: 0, max: 9 }),
            monto: fc.float({ min: 1, max: 500 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (cuotasData, pagosData) => {
          // Create cuotas
          const cuotas = cuotasData.map((data, index) =>
            createCuota(`c${index}`, data.numero, data.monto, '2025-12-01')
          );

          // Create pagos
          const pagos = pagosData
            .filter((data) => data.cuotaIndex < cuotas.length)
            .map((data, index) =>
              createPago(`p${index}`, cuotas[data.cuotaIndex].id, data.monto)
            );

          const saldo = calcularSaldoPendiente(cuotas, pagos);

          // Saldo should equal sum(cuotas) - sum(pagos), but never negative
          const totalCuotas = cuotas.reduce((sum, c) => sum + c.montoProgramado, 0);
          const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);
          const expectedSaldo = Math.max(0, totalCuotas - totalPagos);

          expect(Math.abs(saldo - expectedSaldo)).toBeLessThan(0.01);

          // Saldo should never be negative
          expect(saldo).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property Tests: generarFechasCuotas', () => {
  it('Property 11: No Sundays when excluirDomingos is true', () => {
    // Property 11: Installment Date Generation Correctness
    // Validates: Requirements 5.8

    fc.assert(
      fc.property(
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        fc.integer({ min: 1, max: 30 }),
        (fechaPrimeraCuota, numeroCuotas) => {
          const fechas = generarFechasCuotas(
            fechaPrimeraCuota,
            numeroCuotas,
            'DIARIO',
            true // excluir domingos
          );

          // No date should fall on Sunday
          // Parse dates with explicit time to avoid timezone issues
          fechas.forEach((fecha) => {
            const date = new Date(fecha + 'T12:00:00');
            expect(date.getDay()).not.toBe(0); // 0 = Sunday
          });

          // Should generate correct number of dates
          expect(fechas).toHaveLength(numeroCuotas);
        }
      ),
      { numRuns: 20 }
    );
  });
});
