import type { AccelerometerMeasurement } from 'expo-sensors';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRepeticiones } from '../src/sensors/useRepeticiones';

const mockRemove = jest.fn();
const mockAddListener = jest.fn();
const mockIsAvailable = jest.fn();
const mockSetInterval = jest.fn();

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: (...args: unknown[]) => mockIsAvailable(...args),
    addListener: (...args: unknown[]) => mockAddListener(...args),
    setUpdateInterval: (...args: unknown[]) => mockSetInterval(...args),
  },
}));

type Listener = (medicion: AccelerometerMeasurement) => void;

let listener: Listener = () => undefined;

function emitir(magnitud: number, timestamp: number): void {
  listener({ x: magnitud, y: 0, z: 0, timestamp });
}

beforeAll(() => {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  jest.clearAllMocks();
  listener = () => undefined;
  mockIsAvailable.mockResolvedValue(true);
  mockAddListener.mockImplementation((callback: Listener) => {
    listener = callback;
    return { remove: mockRemove };
  });
});

describe('useRepeticiones', () => {
  it('cuenta repeticiones del sensor y llama al callback', async () => {
    const onRepeticion = jest.fn();
    const { result } = await renderHook(() =>
      useRepeticiones({ onRepeticion }),
    );

    await waitFor(() => expect(result.current.disponible).toBe(true));
    expect(mockSetInterval).toHaveBeenCalledWith(100);

    await act(async () => {
      emitir(1.6, 0.1);
      emitir(1.0, 0.2);
    });

    expect(result.current.repeticiones).toBe(1);
    expect(onRepeticion).toHaveBeenCalledTimes(1);
  });

  it('no se suscribe si el sensor no está disponible', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const { result } = await renderHook(() => useRepeticiones());

    await waitFor(() => expect(mockIsAvailable).toHaveBeenCalled());
    expect(mockAddListener).not.toHaveBeenCalled();
    expect(result.current.disponible).toBe(false);
  });

  it('cancela la suscripción al desactivarse', async () => {
    const { rerender } = await renderHook(
      ({ activo }) => useRepeticiones({ activo }),
      { initialProps: { activo: true } },
    );

    await waitFor(() => expect(mockAddListener).toHaveBeenCalled());
    await rerender({ activo: false });

    expect(mockRemove).toHaveBeenCalled();
  });

  it('no se suscribe si se desmonta antes de la respuesta', async () => {
    let resolver: (valor: boolean) => void = () => undefined;
    mockIsAvailable.mockImplementation(
      () => new Promise<boolean>((resolve) => (resolver = resolve)),
    );
    const { unmount } = await renderHook(() => useRepeticiones());

    await unmount();
    await act(async () => resolver(true));

    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('permite sumar y reiniciar manualmente', async () => {
    const { result } = await renderHook(() =>
      useRepeticiones({ activo: false }),
    );

    await act(async () => result.current.sumar());
    await act(async () => result.current.sumar());
    expect(result.current.repeticiones).toBe(2);

    await act(async () => result.current.reiniciar());
    expect(result.current.repeticiones).toBe(0);
  });
});
