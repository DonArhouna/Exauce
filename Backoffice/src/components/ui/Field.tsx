import {
  cloneElement,
  forwardRef,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-control border border-line bg-surface px-3 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-turquoise-500 focus-visible:ring-2 focus-visible:ring-turquoise-600/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-ivory disabled:text-muted';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Enveloppe libellé + aide + erreur, reliée au contrôle par aria-describedby. */
export function Field({ id, label, hint, error, required, children, className }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const describedControl =
    describedBy && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': describedBy,
        })
      : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-status-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div>{describedControl}</div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-status-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(control, 'h-10', invalid && 'border-status-danger focus:border-status-danger', className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
));
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(control, 'min-h-24 py-2', invalid && 'border-status-danger', className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, invalid, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(control, 'h-10 pr-8', invalid && 'border-status-danger', className)}
    aria-invalid={invalid || undefined}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
