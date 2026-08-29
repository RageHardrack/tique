import { describe, expect, it } from 'vitest';
import { useConfirm } from './useConfirm';

describe('useConfirm Composable (Promise-based UI Confirmation Dialog)', () => {
  it('initializes with default closed state', () => {
    const { state } = useConfirm();
    expect(state.isOpen).toBe(false);
    expect(state.title).toBe('');
    expect(state.message).toBe('');
  });

  it('opens dialog with custom options when confirm() is called', () => {
    const { state, confirm } = useConfirm();

    const promise = confirm({
      title: 'Eliminar cuenta',
      message: '¿Estás seguro de eliminar esta cuenta?',
      confirmText: 'Sí, eliminar',
      cancelText: 'No, cancelar',
      variant: 'danger',
    });

    expect(state.isOpen).toBe(true);
    expect(state.title).toBe('Eliminar cuenta');
    expect(state.message).toBe('¿Estás seguro de eliminar esta cuenta?');
    expect(state.confirmText).toBe('Sí, eliminar');
    expect(state.cancelText).toBe('No, cancelar');
    expect(state.variant).toBe('danger');

    state.onCancel();
    return promise;
  });

  it('resolves to true when onConfirm() is executed', async () => {
    const { state, confirm } = useConfirm();

    const promise = confirm({
      title: 'Confirmar acción',
      message: '¿Deseas continuar?',
    });

    expect(state.isOpen).toBe(true);
    state.onConfirm();

    const result = await promise;
    expect(result).toBe(true);
    expect(state.isOpen).toBe(false);
  });

  it('resolves to false when onCancel() is executed', async () => {
    const { state, confirm } = useConfirm();

    const promise = confirm({
      title: 'Cancelar acción',
      message: '¿Deseas continuar?',
    });

    expect(state.isOpen).toBe(true);
    state.onCancel();

    const result = await promise;
    expect(result).toBe(false);
    expect(state.isOpen).toBe(false);
  });
});
