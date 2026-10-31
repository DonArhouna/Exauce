import { useContext } from 'react';
import { ToastContext } from './toast-context';

/** Accès au centre de notifications éphémères. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans un ToastProvider.');
  return context;
}
