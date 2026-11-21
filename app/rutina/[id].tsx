import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Boton from '../../src/components/Boton';
import SeccionEjercicios from '../../src/components/SeccionEjercicios';
import SeccionSeries from '../../src/components/SeccionSeries';
import {
  crearEjercicio as crearEjercicioService,
  eliminarEjercicio as eliminarEjercicioService,
  listarEjercicios,
  renombrarEjercicio as renombrarEjercicioService,
} from '../../src/services/ejercicioService';
import {
  agregarEjercicio,
  cambiarSeries,
  obtenerRutina,
  quitarEjercicio,
} from '../../src/services/rutinaService';
import {
  actualizarSerie,
  crearSerie,
  eliminarSerie as eliminarSerieService,
  listarSeries,
} from '../../src/services/serieHechaService';
import type {
  Ejercicio,
  Rutina,
  SerieHecha,
  SerieHechaInput,
} from '../../src/services/types';

type Ejecutar = (accion: () => Promise<void>) => Promise<boolean>;

function mensaje(error: unknown): string {
  return error instanceof Error ? error.message : 'Error inesperado';
}

async function ejecutar(accion: () => Promise<void>): Promise<boolean> {
  try {
    await accion();
    return true;
  } catch (error) {
    Alert.alert('Error', mensaje(error));
    return false;
  }
}

function useDetalle(id: string) {
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [series, setSeries] = useState<SerieHecha[]>([]);

  const cargar = useCallback(async () => {
    const [r, e, s] = await Promise.all([
      obtenerRutina(id),
      listarEjercicios(),
      listarSeries(),
    ]);
    setRutina(r);
    setEjercicios(e);
    setSeries(s);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const ejecutarYRecargar: Ejecutar = useCallback(
    async (accion) => {
      const ok = await ejecutar(accion);
      if (ok) {
        await cargar();
      }
      return ok;
    },
    [cargar],
  );

  return { rutina, ejercicios, series, ejecutarYRecargar };
}

function useAcciones(
  id: string,
  ejecutarYRecargar: Ejecutar,
  nombre: string,
  seriesNuevas: string,
  setNombre: (valor: string) => void,
  editandoSerie: SerieHecha | null,
  setEditandoSerie: (serie: SerieHecha | null) => void,
) {
  const crearEjercicio = async (): Promise<boolean> => {
    const ok = await ejecutarYRecargar(async () => {
      const creado = await crearEjercicioService(nombre);
      await agregarEjercicio(id, creado.id, Number(seriesNuevas));
    });
    if (ok) {
      setNombre('');
    }
    return ok;
  };

  const guardarSerie = async (input: SerieHechaInput): Promise<boolean> => {
    const ok = await ejecutarYRecargar(async () => {
      if (editandoSerie) {
        await actualizarSerie(editandoSerie.id, input);
      } else {
        await crearSerie(input);
      }
    });
    if (ok) {
      setEditandoSerie(null);
    }
    return ok;
  };

  return { crearEjercicio, guardarSerie };
}

type Manejadores = {
  onAgregar: (id: string) => Promise<boolean>;
  onSeries: (id: string, series: number) => Promise<boolean>;
  onQuitar: (id: string) => Promise<boolean>;
  onRenombrar: (id: string, nombre: string) => Promise<boolean>;
  onEliminar: (id: string) => Promise<boolean>;
};

function useManejadores(
  id: string,
  ejecutarYRecargar: Ejecutar,
  seriesNuevas: string,
) {
  const ejercicios: Manejadores = {
    onAgregar: (ejercicioId) =>
      ejecutarYRecargar(() =>
        agregarEjercicio(id, ejercicioId, Number(seriesNuevas)),
      ),
    onSeries: (vinculoId, valor) =>
      ejecutarYRecargar(() => cambiarSeries(vinculoId, valor)),
    onQuitar: (vinculoId) =>
      ejecutarYRecargar(() => quitarEjercicio(vinculoId)),
    onRenombrar: (ejercicioId, valor) =>
      ejecutarYRecargar(() => renombrarEjercicioService(ejercicioId, valor)),
    onEliminar: (ejercicioId) =>
      ejecutarYRecargar(() => eliminarEjercicioService(ejercicioId)),
  };
  const eliminarSerie = (serieId: string) =>
    ejecutarYRecargar(() => eliminarSerieService(serieId));
  return { ejercicios, eliminarSerie };
}

export default function RutinaDetalle() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);
  const { rutina, ejercicios, series, ejecutarYRecargar } = useDetalle(id);
  const [nombre, setNombre] = useState('');
  const [seriesNuevas, setSeriesNuevas] = useState('3');
  const [editandoSerie, setEditandoSerie] = useState<SerieHecha | null>(null);
  const { crearEjercicio, guardarSerie } = useAcciones(
    id,
    ejecutarYRecargar,
    nombre,
    seriesNuevas,
    setNombre,
    editandoSerie,
    setEditandoSerie,
  );
  const manejadores = useManejadores(id, ejecutarYRecargar, seriesNuevas);

  if (!rutina) {
    return (
      <View style={styles.container}>
        <Text>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.tituloPrincipal}>{rutina.nombre}</Text>
      <Boton
        etiqueta="Entrenar esta rutina"
        texto="Entrenar"
        onPress={() =>
          router.push({ pathname: '/entrenar/[id]', params: { id } })
        }
      />
      <SeccionEjercicios
        rutina={rutina}
        ejercicios={ejercicios}
        nombre={nombre}
        seriesNuevas={seriesNuevas}
        onNombre={setNombre}
        onSeriesNuevas={setSeriesNuevas}
        onCrear={crearEjercicio}
        {...manejadores.ejercicios}
      />
      <SeccionSeries
        series={series}
        editando={editandoSerie}
        onGuardar={guardarSerie}
        onEditar={setEditandoSerie}
        onCancelar={() => setEditandoSerie(null)}
        onEliminar={manejadores.eliminarSerie}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
