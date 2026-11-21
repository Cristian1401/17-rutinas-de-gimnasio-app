export type ConfigDetector = {
  umbral: number;
  reposicion: number;
  cooldownMs: number;
};

export type MuestraDetector = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
};

export type EstadoDetector = {
  activo: boolean;
  ultimaRepeticion: number | null;
};

export type ResultadoDetector = {
  estado: EstadoDetector;
  repeticion: boolean;
};

export const CONFIG_DEFAULT: ConfigDetector = {
  umbral: 1.5,
  reposicion: 1.1,
  cooldownMs: 400,
};

export function estadoInicial(): EstadoDetector {
  return { activo: false, ultimaRepeticion: null };
}

function validar(config: ConfigDetector): void {
  if (!Number.isFinite(config.umbral) || !Number.isFinite(config.reposicion)) {
    throw new Error('Los umbrales deben ser números');
  }
  if (config.umbral <= config.reposicion) {
    throw new Error('El umbral debe ser mayor que la reposición');
  }
  if (!Number.isFinite(config.cooldownMs) || config.cooldownMs < 0) {
    throw new Error('El cooldown debe ser positivo');
  }
}

function puedeContar(
  estado: EstadoDetector,
  muestra: MuestraDetector,
  config: ConfigDetector,
): boolean {
  return (
    estado.ultimaRepeticion === null ||
    muestra.timestamp - estado.ultimaRepeticion >= config.cooldownMs
  );
}

export function detectarRepeticion(
  estado: EstadoDetector,
  muestra: MuestraDetector,
  config: ConfigDetector,
): ResultadoDetector {
  validar(config);
  const magnitud = Math.hypot(muestra.x, muestra.y, muestra.z);
  if (!estado.activo) {
    return {
      estado: magnitud >= config.umbral ? { ...estado, activo: true } : estado,
      repeticion: false,
    };
  }
  if (magnitud > config.reposicion) {
    return { estado, repeticion: false };
  }
  const repeticion = puedeContar(estado, muestra, config);
  return {
    estado: {
      activo: false,
      ultimaRepeticion: repeticion
        ? muestra.timestamp
        : estado.ultimaRepeticion,
    },
    repeticion,
  };
}
