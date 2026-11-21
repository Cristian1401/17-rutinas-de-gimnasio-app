import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Rutina } from '../services/types';
import ControlesEntrenamiento from './ControlesEntrenamiento';
import SelectorEjercicios from './SelectorEjercicios';

type Props = {
  rutina: Rutina | null;
  seleccionado: string;
  activo: boolean;
  disponible: boolean;
  repeticiones: number;
  peso: string;
  onSeleccionar: (nombre: string) => void;
  onPeso: (valor: string) => void;
  onIniciar: () => void;
  onDetener: () => void;
  onSumar: () => void;
  onGuardar: () => void;
};

export default function PanelEntrenamiento({
  rutina,
  seleccionado,
  activo,
  disponible,
  repeticiones,
  peso,
  onSeleccionar,
  onPeso,
  onIniciar,
  onDetener,
  onSumar,
  onGuardar,
}: Props) {
  if (!rutina) {
    return (
      <View style={styles.container}>
        <Text>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Entrenar: {rutina.nombre}</Text>
      <SelectorEjercicios
        rutina={rutina}
        seleccionado={seleccionado}
        onSeleccionar={onSeleccionar}
      />
      <ControlesEntrenamiento
        activo={activo}
        disponible={disponible}
        repeticiones={repeticiones}
        peso={peso}
        onPeso={onPeso}
        onIniciar={onIniciar}
        onDetener={onDetener}
        onSumar={onSumar}
        onGuardar={onGuardar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
