import { reactive } from 'vue';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const state = reactive<ConfirmState>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'danger',
  onConfirm: () => {},
  onCancel: () => {},
});

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      state.title = options.title ?? 'Confirmar acción';
      state.message = options.message ?? '¿Estás seguro de que deseas continuar?';
      state.confirmText =
        options.confirmText ??
        (options.variant === 'danger' ? 'Eliminar' : 'Confirmar');
      state.cancelText = options.cancelText ?? 'Cancelar';
      state.variant = options.variant ?? 'danger';

      state.onConfirm = () => {
        state.isOpen = false;
        resolve(true);
      };

      state.onCancel = () => {
        state.isOpen = false;
        resolve(false);
      };

      state.isOpen = true;
    });
  }

  return {
    state,
    confirm,
  };
}
