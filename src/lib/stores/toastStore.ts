import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show: (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = crypto.randomUUID();
      const toast: Toast = { id, message, type, duration };

      update(toasts => [...toasts, toast]);

      if (duration > 0) {
        setTimeout(() => {
          update(toasts => toasts.filter(t => t.id !== id));
        }, duration);
      }

      return id;
    },
    success: (message: string, duration?: number) => {
      return createToastStore().show(message, 'success', duration || 3000);
    },
    error: (message: string, duration?: number) => {
      return createToastStore().show(message, 'error', duration || 5000);
    },
    info: (message: string, duration?: number) => {
      return createToastStore().show(message, 'info', duration || 3000);
    },
    remove: (id: string) => {
      update(toasts => toasts.filter(t => t.id !== id));
    },
    clear: () => {
      update(() => []);
    }
  };
}

export const toastStore = createToastStore();
