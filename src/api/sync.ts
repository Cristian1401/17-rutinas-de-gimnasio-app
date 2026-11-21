import { solicitar } from './client';
import {
  aplicarRutinas,
  aplicarSeries,
  fechaCursor,
  mayor,
} from './syncAplicar';
import { guardarCursor, leerCursor } from './sesion';
import type { RutinaRow, SerieHechaRow } from '../db/types';
import * as syncRepo from '../repositories/syncRepository';
import { obtenerRutina } from '../services/rutinaService';
import type {
  Conteo,
  RespuestaPull,
  ResultadoSync,
  RutinaRemota,
  SerieRemota,
} from './syncTipos';

export type { ResultadoSync } from './syncTipos';

const INICIO = '1970-01-01T00:00:00.000Z';

async function pushRutinas(): Promise<Conteo> {
  const pendientes = await syncRepo.listarPendientes<RutinaRow>('rutina');
  const conteo: Conteo = { enviadas: 0, borrados: 0 };
  for (const fila of pendientes) {
    if (fila.deleted === 1) {
      await solicitar(`/api/rutina/${fila.remote_id}`, { method: 'DELETE' });
      conteo.borrados += 1;
    } else {
      const rutina = await obtenerRutina(fila.id);
      await solicitar(`/api/rutina/${fila.remote_id}`, {
        method: 'PUT',
        body: {
          nombre: rutina.nombre,
          ejercicios: rutina.ejercicios.map((ejercicio) => ({
            nombre: ejercicio.nombre,
            series: ejercicio.series,
          })),
        },
      });
      await syncRepo.marcarVinculosSincronizados(fila.id, fila.updated_at);
      await syncRepo.marcarEjerciciosDeRutinaSincronizados(
        fila.id,
        fila.updated_at,
      );
      conteo.enviadas += 1;
    }
    await syncRepo.marcarSincronizado('rutina', fila.id, fila.updated_at);
  }
  return conteo;
}

async function pushSeries(): Promise<Conteo> {
  const pendientes =
    await syncRepo.listarPendientes<SerieHechaRow>('serie_hecha');
  const conteo: Conteo = { enviadas: 0, borrados: 0 };
  for (const fila of pendientes) {
    if (fila.deleted === 1) {
      await solicitar(`/api/serie_hecha/${fila.remote_id}`, {
        method: 'DELETE',
      });
      conteo.borrados += 1;
    } else {
      await solicitar(`/api/serie_hecha/${fila.remote_id}`, {
        method: 'PUT',
        body: {
          ejercicio: fila.ejercicio,
          fecha: fila.fecha,
          repeticiones: fila.repeticiones,
          peso_g: fila.peso_g,
        },
      });
      conteo.enviadas += 1;
    }
    await syncRepo.marcarSincronizado('serie_hecha', fila.id, fila.updated_at);
  }
  return conteo;
}

async function pull<T>(
  recurso: string,
  since: string,
): Promise<RespuestaPull<T>> {
  const ruta = `/api/${recurso}?since=${encodeURIComponent(since)}`;
  const respuesta = await solicitar<RespuestaPull<T>>(ruta);
  return respuesta ?? { items: [], servidor_ahora: since };
}

export async function sincronizarTodo(): Promise<ResultadoSync> {
  const anterior = (await leerCursor()) ?? INICIO;
  const pushRutina = await pushRutinas();
  const pushSerie = await pushSeries();
  const [rutinas, series] = await Promise.all([
    pull<RutinaRemota>('rutina', anterior),
    pull<SerieRemota>('serie_hecha', anterior),
  ]);
  const descargadas =
    (await aplicarRutinas(rutinas.items)) + (await aplicarSeries(series.items));
  await guardarCursor(
    mayor(fechaCursor(rutinas, anterior), fechaCursor(series, anterior)),
  );
  return {
    enviadas: pushRutina.enviadas + pushSerie.enviadas,
    borrados: pushRutina.borrados + pushSerie.borrados,
    descargadas,
  };
}
