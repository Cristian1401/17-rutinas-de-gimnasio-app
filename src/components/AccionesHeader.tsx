import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { cerrarSesion, haySesion } from '../api/auth';
import { mensajeError } from '../api/errores';
import { sincronizarTodo } from '../api/sync';
import Boton from './Boton';

export default function AccionesHeader() {
  const router = useRouter();
  const [sesion, setSesion] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void haySesion().then(setSesion);
    }, []),
  );

  const cuenta = () => {
    if (!sesion) {
      router.push('/login');
      return;
    }
    void cerrarSesion().then(() => {
      setSesion(false);
      Alert.alert('Sesión', 'Sesión cerrada');
    });
  };

  const sincronizar = () => {
    if (!sesion) {
      Alert.alert('Sincronización', 'Inicia sesión para sincronizar');
      return;
    }
    void sincronizarTodo()
      .then((resultado) => {
        Alert.alert(
          'Sincronización',
          `${resultado.enviadas} enviadas, ${resultado.descargadas} descargadas`,
        );
      })
      .catch((error: unknown) => {
        Alert.alert('Sincronización', mensajeError(error));
      });
  };

  return (
    <View style={styles.fila}>
      <Boton
        etiqueta="Sincronizar datos con la nube"
        texto="Sync"
        onPress={sincronizar}
      />
      <Boton
        etiqueta={sesion ? 'Cerrar sesión' : 'Iniciar sesión'}
        texto={sesion ? 'Salir' : 'Login'}
        onPress={cuenta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
  },
});
