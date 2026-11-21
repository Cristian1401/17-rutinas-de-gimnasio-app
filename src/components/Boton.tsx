import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  etiqueta: string;
  texto: string;
  onPress: () => void;
  peligro?: boolean;
};

export default function Boton({
  etiqueta,
  texto,
  onPress,
  peligro = false,
}: Props) {
  return (
    <Pressable
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={[styles.boton, peligro && styles.peligro]}
    >
      <Text style={styles.texto}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginLeft: 8,
    marginTop: 8,
    padding: 8,
  },
  peligro: {
    backgroundColor: '#b91c1c',
  },
  texto: {
    color: '#fff',
    textAlign: 'center',
  },
});
