import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SerieHecha, SerieHechaInput } from '../services/types';
import Boton from './Boton';
import Campo from './Campo';

type Props = {
  inicial?: SerieHecha;
  onGuardar: (input: SerieHechaInput) => Promise<boolean>;
  onCancelar?: () => void;
};

type CampoProps = {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  numerico?: boolean;
};

const hoy = () => new Date().toISOString().slice(0, 10);

export default function FormularioSerie({
  inicial,
  onGuardar,
  onCancelar,
}: Props) {
  const [ejercicio, setEjercicio] = useState(inicial?.ejercicio ?? '');
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy());
  const [repeticiones, setRepeticiones] = useState(
    String(inicial?.repeticiones ?? 10),
  );
  const [pesoG, setPesoG] = useState(
    inicial?.pesoG === undefined ? '' : String(inicial.pesoG),
  );

  const submit = async () => {
    const input: SerieHechaInput = {
      ejercicio,
      fecha,
      repeticiones: Number(repeticiones),
      ...(pesoG === '' ? {} : { pesoG: Number(pesoG) }),
    };
    if (await onGuardar(input)) {
      setEjercicio('');
      setRepeticiones('10');
      setPesoG('');
    }
  };

  const campos: CampoProps[] = [
    {
      etiqueta: 'Ejercicio de la serie',
      valor: ejercicio,
      onChange: setEjercicio,
    },
    { etiqueta: 'Fecha YYYY-MM-DD', valor: fecha, onChange: setFecha },
    {
      etiqueta: 'Repeticiones',
      numerico: true,
      valor: repeticiones,
      onChange: setRepeticiones,
    },
    {
      etiqueta: 'Peso en gramos',
      numerico: true,
      valor: pesoG,
      onChange: setPesoG,
    },
  ];

  return (
    <View style={styles.formulario}>
      {campos.map((campo) => (
        <Campo key={campo.etiqueta} {...campo} />
      ))}
      <Boton
        etiqueta={inicial ? 'Guardar cambios de la serie' : 'Crear serie hecha'}
        texto={inicial ? 'Guardar cambios' : 'Crear serie'}
        onPress={() => void submit()}
      />
      {onCancelar && (
        <Boton
          etiqueta="Cancelar edición de la serie"
          texto="Cancelar"
          onPress={onCancelar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: {
    marginTop: 12,
  },
});
