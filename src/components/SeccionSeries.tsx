import { StyleSheet, Text, View } from 'react-native';
import type { SerieHecha, SerieHechaInput } from '../services/types';
import FormularioSerie from './FormularioSerie';
import SerieItem from './SerieItem';

type Props = {
  series: SerieHecha[];
  editando: SerieHecha | null;
  onGuardar: (input: SerieHechaInput) => Promise<boolean>;
  onEditar: (serie: SerieHecha) => void;
  onCancelar: () => void;
  onEliminar: (id: string) => Promise<boolean>;
};

export default function SeccionSeries({
  series,
  editando,
  onGuardar,
  onEditar,
  onCancelar,
  onEliminar,
}: Props) {
  return (
    <View>
      <Text style={styles.titulo}>Series hechas</Text>
      <FormularioSerie
        key={editando?.id ?? 'nueva'}
        inicial={editando ?? undefined}
        onGuardar={onGuardar}
        onCancelar={editando ? onCancelar : undefined}
      />
      {series.map((serie) => (
        <SerieItem
          key={serie.id}
          serie={serie}
          onEditar={() => onEditar(serie)}
          onEliminar={() => onEliminar(serie.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
