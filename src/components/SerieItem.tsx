import { StyleSheet, Text, View } from 'react-native';
import type { SerieHecha } from '../services/types';
import Boton from './Boton';

type Props = {
  serie: SerieHecha;
  onEditar: () => void;
  onEliminar: () => Promise<boolean>;
};

export default function SerieItem({ serie, onEditar, onEliminar }: Props) {
  const peso = serie.pesoG === undefined ? '-' : `${serie.pesoG} g`;
  return (
    <View style={styles.fila}>
      <Text style={styles.texto}>
        {serie.fecha} · {serie.ejercicio} · {serie.repeticiones} rep · {peso}
      </Text>
      <Boton
        etiqueta={`Editar serie de ${serie.ejercicio} del ${serie.fecha}`}
        texto="Editar"
        onPress={onEditar}
      />
      <Boton
        etiqueta={`Eliminar serie de ${serie.ejercicio} del ${serie.fecha}`}
        peligro
        texto="Eliminar"
        onPress={() => void onEliminar()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  texto: {
    fontSize: 14,
  },
});
