import { StyleSheet, Text, View } from 'react-native';
import type { Ejercicio, Rutina } from '../services/types';
import Boton from './Boton';
import Campo from './Campo';
import EjercicioGlobal from './EjercicioGlobal';
import EjercicioVinculado from './EjercicioVinculado';

type Props = {
  rutina: Rutina;
  ejercicios: Ejercicio[];
  nombre: string;
  seriesNuevas: string;
  onNombre: (valor: string) => void;
  onSeriesNuevas: (valor: string) => void;
  onCrear: () => Promise<boolean>;
  onAgregar: (id: string) => Promise<boolean>;
  onSeries: (id: string, series: number) => Promise<boolean>;
  onQuitar: (id: string) => Promise<boolean>;
  onRenombrar: (id: string, nombre: string) => Promise<boolean>;
  onEliminar: (id: string) => Promise<boolean>;
};

export default function SeccionEjercicios({
  rutina,
  ejercicios,
  nombre,
  seriesNuevas,
  onNombre,
  onSeriesNuevas,
  onCrear,
  onAgregar,
  onSeries,
  onQuitar,
  onRenombrar,
  onEliminar,
}: Props) {
  const vinculados = new Set(rutina.ejercicios.map((item) => item.ejercicioId));
  return (
    <View>
      <Text style={styles.titulo}>Ejercicios de la rutina</Text>
      {rutina.ejercicios.map((ejercicio) => (
        <EjercicioVinculado
          key={ejercicio.id}
          ejercicio={ejercicio}
          onSeries={(valor) => onSeries(ejercicio.id, valor)}
          onQuitar={() => onQuitar(ejercicio.id)}
        />
      ))}
      <Text style={styles.titulo}>Nuevo ejercicio</Text>
      <Campo
        etiqueta="Nombre del nuevo ejercicio"
        valor={nombre}
        onChange={onNombre}
      />
      <Campo
        etiqueta="Series del nuevo ejercicio"
        numerico
        valor={seriesNuevas}
        onChange={onSeriesNuevas}
      />
      <Boton
        etiqueta="Crear y añadir ejercicio"
        texto="Crear y añadir"
        onPress={() => void onCrear()}
      />
      <Text style={styles.titulo}>Todos los ejercicios</Text>
      {ejercicios.map((ejercicio) => (
        <EjercicioGlobal
          key={ejercicio.id}
          ejercicio={ejercicio}
          vinculado={vinculados.has(ejercicio.id)}
          onAgregar={() => onAgregar(ejercicio.id)}
          onRenombrar={(valor) => onRenombrar(ejercicio.id, valor)}
          onEliminar={() => onEliminar(ejercicio.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
