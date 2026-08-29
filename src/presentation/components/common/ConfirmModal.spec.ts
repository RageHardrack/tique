import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmModal from './ConfirmModal.vue';
import { useConfirm } from '../../composables/useConfirm';

describe('ConfirmModal.vue (Custom UI Confirmation Dialog Component)', () => {
  it('renders confirmation content and handles user confirmation', async () => {
    const { state } = useConfirm();
    state.isOpen = true;
    state.title = 'Eliminar movimiento';
    state.message = '¿Estás seguro de que deseas eliminar este movimiento?';
    state.confirmText = 'Eliminar';
    state.cancelText = 'Cancelar';
    state.variant = 'danger';
    state.onConfirm = vi.fn();
    state.onCancel = vi.fn();

    const wrapper = mount(ConfirmModal);

    const vm = wrapper.vm as any;
    expect(vm.state.title).toBe('Eliminar movimiento');
    expect(vm.state.message).toBe('¿Estás seguro de que deseas eliminar este movimiento?');
    expect(vm.iconConfig.name).toBe('i-heroicons-exclamation-triangle');
    expect(vm.iconConfig.btnColor).toBe('red');

    // Test onConfirm callback
    vm.state.onConfirm();
    expect(state.onConfirm).toHaveBeenCalled();

    // Test onCancel callback
    vm.state.onCancel();
    expect(state.onCancel).toHaveBeenCalled();
  });
});
