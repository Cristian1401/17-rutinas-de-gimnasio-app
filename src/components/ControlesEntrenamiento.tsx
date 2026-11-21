import { StyleSheet, Text } from 'react-native';
import Boton from './Boton';
import Campo from './Campo';

type Props = {
  activo: boolean;
  disponible: boolean;
  repeticiones: number;
  peso: string;
  onPeso: (valor: string) => void;
  onIniciar: () => void;
  onDetener: () => void;
  onSumar: () => void;
  onGuardar: () => void;
};

export default function ControlesEntrenamiento({
  activo,
  disponible,
  repeticiones,
  peso,
  onPeso,
  onIniciar,
  onDetener,
  onSumar,
  onGuardar,
}: Props) {
  return (
    <>
      <Text style={styles.contador}>Repeticiones: {repeticiones}</Text>
      {activo && !disponible && (
        <Text style={styles.aviso}>
          Acelerómetro no disponible: usa el botón +1.
        </Text>
      )}
      <Boton
        etiqueta="Iniciar detección automática de repeticiones"
        texto="Iniciar"
        onPress={onIniciar}
      />
      <Boton
        etiqueta="Detener detección automática de repeticiones"
        texto="Detener"
        onPress={onDetener}
      />
      <Boton
        etiqueta="Sumar repetición manualmente"
        texto="+1 repetición"
        onPress={onSumar}
      />
      <Campo
        etiqueta="Peso en gramos"
        valor={peso}
        onChange={onPeso}
        numerico
      />
      <Boton
        etiqueta="Guardar serie hecha"
        texto="Guardar serie"
        onPress={onGuardar}
      />
    </>
  );
}

const styles = StyleSheet.create({
  aviso: {
    color: '#f59e0b',
    marginTop: 8,
  },
  contador: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
