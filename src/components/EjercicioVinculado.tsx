import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EjercicioDetalle } from '../services/types';
import Boton from './Boton';
import Campo from './Campo';

type Props = {
  ejercicio: EjercicioDetalle;
  onSeries: (series: number) => Promise<boolean>;
  onQuitar: () => Promise<boolean>;
};

export default function EjercicioVinculado({
  ejercicio,
  onSeries,
  onQuitar,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(ejercicio.series));

  const guardar = async () => {
    if (await onSeries(Number(valor))) {
      setEditando(false);
    }
  };

  return (
    <View style={styles.fila}>
      <Text style={styles.nombre}>
        {ejercicio.nombre} · {ejercicio.series} series
      </Text>
      {editando ? (
        <View>
          <Campo
            etiqueta={`Series de ${ejercicio.nombre}`}
            numerico
            valor={valor}
            onChange={setValor}
          />
          <Boton
            etiqueta={`Guardar series de ${ejercicio.nombre}`}
            texto="Guardar"
            onPress={() => void guardar()}
          />
          <Boton
            etiqueta="Cancelar edición de series"
            texto="Cancelar"
            onPress={() => setEditando(false)}
          />
        </View>
      ) : (
        <View>
          <Boton
            etiqueta={`Editar series de ${ejercicio.nombre}`}
            texto="Series"
            onPress={() => setEditando(true)}
          />
          <Boton
            etiqueta={`Quitar ${ejercicio.nombre} de la rutina`}
            peligro
            texto="Quitar"
            onPress={() => void onQuitar()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  nombre: {
    fontSize: 16,
  },
});
