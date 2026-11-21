import type { Rutina } from '../services/types';
import Boton from './Boton';
import Campo from './Campo';

type Props = {
  rutina: Rutina;
  seleccionado: string;
  onSeleccionar: (nombre: string) => void;
};

export default function SelectorEjercicios({
  rutina,
  seleccionado,
  onSeleccionar,
}: Props) {
  return (
    <>
      {rutina.ejercicios.map((item) => (
        <Boton
          key={item.id}
          etiqueta={`Seleccionar ${item.nombre}`}
          texto={item.nombre}
          onPress={() => onSeleccionar(item.nombre)}
        />
      ))}
      <Campo
        etiqueta="Ejercicio de la serie"
        valor={seleccionado}
        onChange={onSeleccionar}
      />
    </>
  );
}
