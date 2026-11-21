import { StyleSheet, TextInput } from 'react-native';

type Props = {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  numerico?: boolean;
};

export default function Campo({
  etiqueta,
  valor,
  onChange,
  placeholder,
  numerico = false,
}: Props) {
  return (
    <TextInput
      accessibilityLabel={etiqueta}
      keyboardType={numerico ? 'numeric' : 'default'}
      placeholder={placeholder}
      style={styles.campo}
      value={valor}
      onChangeText={onChange}
    />
  );
}

const styles = StyleSheet.create({
  campo: {
    borderColor: '#64748b',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
});
