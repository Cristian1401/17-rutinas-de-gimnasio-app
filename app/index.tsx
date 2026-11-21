import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  crearRutina,
  eliminarRutina,
  listarRutinas,
  renombrarRutina,
} from '../src/services/rutinaService';
import type { Rutina } from '../src/services/types';

type FormValues = { nombre: string; ejercicio: string; series: string };

function mensaje(error: unknown): string {
  return error instanceof Error ? error.message : 'Error inesperado';
}

function RutinaForm({
  onCreate,
}: {
  onCreate: (values: FormValues) => Promise<boolean>;
}) {
  const [nombre, setNombre] = useState('');
  const [ejercicio, setEjercicio] = useState('');
  const [series, setSeries] = useState('3');

  const submit = async () => {
    if (await onCreate({ nombre, ejercicio, series })) {
      setNombre('');
      setEjercicio('');
    }
  };

  return (
    <View>
      <TextInput
        accessibilityLabel="Nombre de la rutina"
        placeholder="Nombre de la rutina"
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        accessibilityLabel="Primer ejercicio"
        placeholder="Primer ejercicio"
        style={styles.input}
        value={ejercicio}
        onChangeText={setEjercicio}
      />
      <TextInput
        accessibilityLabel="Series del primer ejercicio"
        keyboardType="numeric"
        placeholder="Series"
        style={styles.input}
        value={series}
        onChangeText={setSeries}
      />
      <Pressable
        accessibilityLabel="Crear rutina"
        onPress={() => void submit()}
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>Crear rutina</Text>
      </Pressable>
    </View>
  );
}

function RutinaFila({
  rutina,
  onAbrir,
  onEditar,
  onEliminar,
}: {
  rutina: Rutina;
  onAbrir: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <View>
      <Pressable
        accessibilityLabel={`Abrir rutina ${rutina.nombre}`}
        onPress={onAbrir}
      >
        <Text style={styles.nombre}>{rutina.nombre}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Editar rutina ${rutina.nombre}`}
        onPress={onEditar}
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>Editar</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Eliminar rutina ${rutina.nombre}`}
        onPress={onEliminar}
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>Eliminar</Text>
      </Pressable>
    </View>
  );
}

function RutinaEdicion({
  nombre,
  onNombre,
  onGuardar,
  onCancelar,
}: {
  nombre: string;
  onNombre: (value: string) => void;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  return (
    <View>
      <TextInput
        accessibilityLabel="Nuevo nombre de la rutina"
        style={styles.input}
        value={nombre}
        onChangeText={onNombre}
      />
      <Pressable
        accessibilityLabel="Guardar nombre de la rutina"
        onPress={onGuardar}
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>Guardar</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Cancelar edición"
        onPress={onCancelar}
        style={styles.boton}
      >
        <Text style={styles.botonTexto}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

function useRutinas() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const cargar = useCallback(async () => {
    setRutinas(await listarRutinas());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const crear = async (values: FormValues): Promise<boolean> => {
    try {
      await crearRutina({
        nombre: values.nombre,
        ejercicios: [
          { nombre: values.ejercicio, series: Number(values.series) },
        ],
      });
      await cargar();
      return true;
    } catch (error) {
      Alert.alert('No se pudo crear', mensaje(error));
      return false;
    }
  };

  const borrar = async (id: string): Promise<void> => {
    try {
      await eliminarRutina(id);
      await cargar();
    } catch (error) {
      Alert.alert('No se pudo eliminar', mensaje(error));
    }
  };

  const renombrar = async (id: string, nombre: string): Promise<boolean> => {
    try {
      await renombrarRutina(id, nombre);
      await cargar();
      return true;
    } catch (error) {
      Alert.alert('No se pudo guardar', mensaje(error));
      return false;
    }
  };

  return { rutinas, crear, borrar, renombrar };
}

function confirmarBorrado(
  rutina: Rutina,
  borrar: (id: string) => Promise<void>,
): void {
  Alert.alert('Eliminar rutina', `¿Eliminar ${rutina.nombre}?`, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: () => void borrar(rutina.id),
    },
  ]);
}

export default function Index() {
  const router = useRouter();
  const { rutinas, crear, borrar, renombrar } = useRutinas();
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');

  const guardar = async (rutina: Rutina) => {
    if (await renombrar(rutina.id, nombreEditado)) {
      setEditando(null);
    }
  };

  const abrir = (rutina: Rutina) => {
    router.push({ pathname: '/rutina/[id]', params: { id: rutina.id } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Rutinas</Text>
      <RutinaForm onCreate={crear} />
      {rutinas.map((rutina) => (
        <View key={rutina.id} style={styles.tarjeta}>
          {editando === rutina.id ? (
            <RutinaEdicion
              nombre={nombreEditado}
              onNombre={setNombreEditado}
              onGuardar={() => void guardar(rutina)}
              onCancelar={() => setEditando(null)}
            />
          ) : (
            <RutinaFila
              rutina={rutina}
              onAbrir={() => abrir(rutina)}
              onEditar={() => {
                setEditando(rutina.id);
                setNombreEditado(rutina.nombre);
              }}
              onEliminar={() => confirmarBorrado(rutina, borrar)}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginTop: 8,
    padding: 10,
  },
  botonTexto: {
    color: '#fff',
    textAlign: 'center',
  },
  container: {
    padding: 16,
  },
  input: {
    borderColor: '#64748b',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tarjeta: {
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
