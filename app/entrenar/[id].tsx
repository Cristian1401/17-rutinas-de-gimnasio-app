import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { mensajeError } from '../../src/api/errores';
import PanelEntrenamiento from '../../src/components/PanelEntrenamiento';
import { useRepeticiones } from '../../src/sensors/useRepeticiones';
import { crearSerie } from '../../src/services/serieHechaService';
import { obtenerRutina } from '../../src/services/rutinaService';
import type { Rutina } from '../../src/services/types';

function useRutinaEntrenamiento(id: string): Rutina | null {
  const [rutina, setRutina] = useState<Rutina | null>(null);
  useEffect(() => {
    let vivo = true;
    void obtenerRutina(id)
      .then((valor) => {
        if (vivo) {
          setRutina(valor);
        }
      })
      .catch((error: unknown) => {
        if (vivo) {
          Alert.alert('Error', mensajeError(error));
        }
      });
    return () => {
      vivo = false;
    };
  }, [id]);
  return rutina;
}

async function guardarSerie(
  seleccionado: string,
  repeticiones: number,
  peso: string,
  reiniciar: () => void,
  setActivo: (valor: boolean) => void,
): Promise<void> {
  if (seleccionado.trim() === '' || repeticiones === 0) {
    Alert.alert('Serie', 'Elige un ejercicio y cuenta al menos una repetición');
    return;
  }
  try {
    await crearSerie({
      ejercicio: seleccionado,
      fecha: new Date().toISOString().slice(0, 10),
      repeticiones,
      ...(peso === '' ? {} : { pesoG: Number(peso) }),
    });
    Alert.alert('Serie guardada', `${repeticiones} repeticiones`);
    reiniciar();
    setActivo(false);
  } catch (error) {
    Alert.alert('Error', mensajeError(error));
  }
}

export default function Entrenar() {
  const params = useLocalSearchParams<{ id: string }>();
  const rutina = useRutinaEntrenamiento(String(params.id));
  const [ejercicio, setEjercicio] = useState('');
  const [peso, setPeso] = useState('');
  const [activo, setActivo] = useState(false);
  const { disponible, repeticiones, reiniciar, sumar } = useRepeticiones({
    activo,
  });
  const seleccionado = ejercicio || rutina?.ejercicios[0]?.nombre || '';

  const iniciar = () => {
    reiniciar();
    setActivo(true);
  };

  const guardar = () =>
    void guardarSerie(seleccionado, repeticiones, peso, reiniciar, setActivo);

  return (
    <PanelEntrenamiento
      rutina={rutina}
      seleccionado={seleccionado}
      activo={activo}
      disponible={disponible}
      repeticiones={repeticiones}
      peso={peso}
      onSeleccionar={setEjercicio}
      onPeso={setPeso}
      onIniciar={iniciar}
      onDetener={() => setActivo(false)}
      onSumar={sumar}
      onGuardar={() => void guardar()}
    />
  );
}
