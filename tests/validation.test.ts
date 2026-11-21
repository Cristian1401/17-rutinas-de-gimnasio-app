import {
  validateEjercicios,
  validateFecha,
  validateNombre,
  validatePeso,
  validateRepeticiones,
  validateSerie,
  validateSeries,
} from '../src/services/validation';

describe('validation', () => {
  it('recorta y valida nombres', () => {
    expect(validateNombre('  Press  ')).toBe('Press');
    expect(() => validateNombre('   ')).toThrow('entre 1 y 80');
    expect(() => validateNombre('x'.repeat(81))).toThrow('entre 1 y 80');
  });

  it('valida series y repeticiones', () => {
    expect(validateSeries(1)).toBe(1);
    expect(validateSeries(10)).toBe(10);
    expect(() => validateSeries(0)).toThrow('entre 1 y 10');
    expect(() => validateSeries(1.5)).toThrow('entre 1 y 10');
    expect(validateRepeticiones(100)).toBe(100);
    expect(() => validateRepeticiones(101)).toThrow('entre 1 y 100');
    expect(() => validateRepeticiones(2.5)).toThrow('entre 1 y 100');
  });

  it('valida fechas YYYY-MM-DD', () => {
    expect(validateFecha('2026-11-21')).toBe('2026-11-21');
    expect(() => validateFecha('21/11/2026')).toThrow('YYYY-MM-DD');
    expect(() => validateFecha('2026-02-30')).toThrow('YYYY-MM-DD');
  });

  it('valida el peso opcional', () => {
    expect(validatePeso()).toBeNull();
    expect(validatePeso(0)).toBe(0);
    expect(validatePeso(12.5)).toBe(12.5);
    expect(() => validatePeso(-1)).toThrow('positivo');
    expect(() => validatePeso(Number.NaN)).toThrow('positivo');
  });

  it('valida la lista de ejercicios de una rutina', () => {
    expect(() =>
      validateEjercicios([{ nombre: 'Press', series: 3 }]),
    ).not.toThrow();
    expect(() => validateEjercicios([])).toThrow('al menos un ejercicio');
    expect(() => validateEjercicios([{ nombre: ' ', series: 3 }])).toThrow(
      'entre 1 y 80',
    );
    expect(() => validateEjercicios([{ nombre: 'Press', series: 11 }])).toThrow(
      'entre 1 y 10',
    );
  });

  it('valida una serie completa', () => {
    expect(
      validateSerie({
        ejercicio: ' Press ',
        fecha: '2026-11-21',
        repeticiones: 10,
        pesoG: 20,
      }),
    ).toEqual({
      ejercicio: 'Press',
      fecha: '2026-11-21',
      repeticiones: 10,
      pesoG: 20,
    });
    expect(
      validateSerie({
        ejercicio: 'Press',
        fecha: '2026-11-21',
        repeticiones: 10,
      }).pesoG,
    ).toBeNull();
  });
});
