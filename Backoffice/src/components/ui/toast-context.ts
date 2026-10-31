import { createContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
}

export interface ToastApi {
  push: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
