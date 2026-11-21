import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Ejercicio } from '../services/types';
import Boton from './Boton';
import Campo from './Campo';

type Props = {
  ejercicio: Ejercicio;
  vinculado: boolean;
  onAgregar: () => Promise<boolean>;
  onRenombrar: (nombre: string) => Promise<boolean>;
  onEliminar: () => Promise<boolean>;
};

export default function EjercicioGlobal({
  ejercicio,
  vinculado,
  onAgregar,
  onRenombrar,
  onEliminar,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(ejercicio.nombre);

  const guardar = async () => {
    if (await onRenombrar(nombre)) {
      setEditando(false);
    }
  };

  return (
    <View style={styles.fila}>
      {editando ? (
        <View>
          <Campo
            etiqueta={`Nuevo nombre de ${ejercicio.nombre}`}
            valor={nombre}
            onChange={setNombre}
          />
          <Boton
            etiqueta={`Guardar nombre de ${ejercicio.nombre}`}
            texto="Guardar"
            onPress={() => void guardar()}
          />
          <Boton
            etiqueta="Cancelar edición del ejercicio"
            texto="Cancelar"
            onPress={() => setEditando(false)}
          />
        </View>
      ) : (
        <View>
          <Text style={styles.nombre}>{ejercicio.nombre}</Text>
          {!vinculado && (
            <Boton
              etiqueta={`Añadir ${ejercicio.nombre} a la rutina`}
              texto="Añadir"
              onPress={() => void onAgregar()}
            />
          )}
          <Boton
            etiqueta={`Renombrar ${ejercicio.nombre}`}
            texto="Renombrar"
            onPress={() => setEditando(true)}
          />
          <Boton
            etiqueta={`Eliminar ejercicio ${ejercicio.nombre}`}
            peligro
            texto="Eliminar"
            onPress={() => void onEliminar()}
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
