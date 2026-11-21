import {
  CONFIG_DEFAULT,
  detectarRepeticion,
  estadoInicial,
  type ConfigDetector,
  type EstadoDetector,
  type MuestraDetector,
} from '../src/sensors/repDetector';

const config: ConfigDetector = {
  umbral: 1.5,
  reposicion: 1.1,
  cooldownMs: 400,
};

function muestra(magnitud: number, timestamp: number): MuestraDetector {
  return { x: magnitud, y: 0, z: 0, timestamp };
}

function procesar(estado: EstadoDetector, valores: [number, number][]) {
  return valores.reduce(
    (actual, [magnitud, timestamp]) =>
      detectarRepeticion(actual.estado, muestra(magnitud, timestamp), config),
    { estado, repeticion: false },
  ).repeticion;
}

describe('repDetector', () => {
  it('cuenta tras superar el umbral y volver por debajo de la reposición', () => {
    const estado = estadoInicial();
    const arriba = detectarRepeticion(estado, muestra(1.6, 100), config);
    expect(arriba.repeticion).toBe(false);
    expect(arriba.estado.activo).toBe(true);

    const entre = detectarRepeticion(arriba.estado, muestra(1.3, 200), config);
    expect(entre.repeticion).toBe(false);
    expect(entre.estado.activo).toBe(true);

    const abajo = detectarRepeticion(entre.estado, muestra(1.0, 300), config);
    expect(abajo.repeticion).toBe(true);
    expect(abajo.estado.ultimaRepeticion).toBe(300);
  });

  it('no cuenta si no se supera el umbral', () => {
    const resultado = procesar(estadoInicial(), [
      [1.0, 100],
      [1.2, 200],
      [0.9, 300],
    ]);
    expect(resultado).toBe(false);
  });

  it('aplica cooldown entre repeticiones', () => {
    const estado = estadoInicial();
    let resultado = detectarRepeticion(estado, muestra(1.6, 100), config);
    resultado = detectarRepeticion(resultado.estado, muestra(1.0, 200), config);
    expect(resultado.repeticion).toBe(true);

    resultado = detectarRepeticion(resultado.estado, muestra(1.6, 300), config);
    resultado = detectarRepeticion(resultado.estado, muestra(1.0, 500), config);
    expect(resultado.repeticion).toBe(false);

    resultado = detectarRepeticion(resultado.estado, muestra(1.6, 900), config);
    resultado = detectarRepeticion(
      resultado.estado,
      muestra(1.0, 1000),
      config,
    );
    expect(resultado.repeticion).toBe(true);
  });

  it('usa la configuración por defecto', () => {
    expect(CONFIG_DEFAULT.umbral).toBeGreaterThan(CONFIG_DEFAULT.reposicion);
    expect(CONFIG_DEFAULT.cooldownMs).toBe(400);
  });

  it('rechaza configuraciones inválidas', () => {
    expect(() =>
      detectarRepeticion(estadoInicial(), muestra(1.6, 1), {
        ...config,
        umbral: 1,
      }),
    ).toThrow('El umbral debe ser mayor que la reposición');
    expect(() =>
      detectarRepeticion(estadoInicial(), muestra(1.6, 1), {
        ...config,
        reposicion: Number.NaN,
      }),
    ).toThrow('Los umbrales deben ser números');
    expect(() =>
      detectarRepeticion(estadoInicial(), muestra(1.6, 1), {
        ...config,
        cooldownMs: -1,
      }),
    ).toThrow('El cooldown debe ser positivo');
  });
});
