import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { iniciarSesion, registrarse } from '../src/api/auth';
import { mensajeError } from '../src/api/errores';
import Boton from '../src/components/Boton';
import Campo from '../src/components/Campo';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registro, setRegistro] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const submit = async () => {
    if (email.trim() === '' || password === '') {
      Alert.alert('Acceso', 'Escribe correo y contraseña');
      return;
    }
    setEnviando(true);
    try {
      if (registro) {
        await registrarse(email.trim(), password);
      } else {
        await iniciarSesion(email.trim(), password);
      }
      router.replace('/');
    } catch (error) {
      Alert.alert('Acceso', mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>
        {registro ? 'Crear cuenta' : 'Iniciar sesión'}
      </Text>
      <Campo
        etiqueta="Correo electrónico"
        valor={email}
        onChange={setEmail}
        placeholder="nombre@correo.com"
      />
      <Campo
        etiqueta="Contraseña"
        valor={password}
        onChange={setPassword}
        seguro
      />
      <View style={styles.fila}>
        <Boton
          etiqueta={registro ? 'Crear cuenta' : 'Entrar'}
          texto={enviando ? 'Espere…' : registro ? 'Registrar' : 'Entrar'}
          onPress={() => void submit()}
        />
        <Boton
          etiqueta={registro ? 'Ir a iniciar sesión' : 'Ir a crear cuenta'}
          texto={registro ? 'Ya tengo cuenta' : 'Crear cuenta'}
          onPress={() => setRegistro(!registro)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  fila: {
    flexDirection: 'row',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
