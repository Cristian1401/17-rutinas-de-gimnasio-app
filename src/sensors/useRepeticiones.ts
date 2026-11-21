import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONFIG_DEFAULT,
  detectarRepeticion,
  estadoInicial,
  type ConfigDetector,
  type MuestraDetector,
} from './repDetector';

type Opciones = {
  config?: ConfigDetector;
  activo?: boolean;
  onRepeticion?: () => void;
};

type Suscripcion = { remove: () => void };

function aMuestra(medicion: AccelerometerMeasurement): MuestraDetector {
  return {
    x: medicion.x,
    y: medicion.y,
    z: medicion.z,
    timestamp: medicion.timestamp * 1000,
  };
}

export function useRepeticiones({
  config = CONFIG_DEFAULT,
  activo = true,
  onRepeticion,
}: Opciones = {}) {
  const [disponible, setDisponible] = useState(false);
  const [repeticiones, setRepeticiones] = useState(0);
  const estado = useRef(estadoInicial());
  const callback = useRef(onRepeticion);

  useEffect(() => {
    callback.current = onRepeticion;
  }, [onRepeticion]);

  const reiniciar = useCallback(() => {
    estado.current = estadoInicial();
    setRepeticiones(0);
  }, []);

  const sumar = useCallback(() => {
    setRepeticiones((valor) => valor + 1);
  }, []);

  useEffect(() => {
    if (!activo) {
      return;
    }
    let cancelado = false;
    let suscripcion: Suscripcion | undefined;
    void Accelerometer.isAvailableAsync().then((disponibleSensor) => {
      if (cancelado || !disponibleSensor) {
        return;
      }
      Accelerometer.setUpdateInterval(100);
      setDisponible(true);
      suscripcion = Accelerometer.addListener((medicion) => {
        const resultado = detectarRepeticion(
          estado.current,
          aMuestra(medicion),
          config,
        );
        estado.current = resultado.estado;
        if (resultado.repeticion) {
          setRepeticiones((valor) => valor + 1);
          callback.current?.();
        }
      });
    });
    return () => {
      cancelado = true;
      suscripcion?.remove();
    };
  }, [activo, config]);

  return { disponible, repeticiones, reiniciar, sumar };
}
