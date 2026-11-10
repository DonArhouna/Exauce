import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Textarea } from '@/components/ui';
import type { SectionField, SectionValues } from '@/services/api/types';

interface SectionFieldControlProps {
  idPrefix: string;
  field: SectionField;
  value: unknown;
  disabled: boolean;
  error?: string;
  onChange: (value: unknown) => void;
}

/** Rend un champ décrit par le schéma du type de section (aucun code par type). */
export function SectionFieldControl({
  idPrefix,
  field,
  value,
  disabled,
  error,
  onChange,
}: SectionFieldControlProps) {
  const { t } = useTranslation();
  const draggedIndex = useRef<number | null>(null);
  const id = `${idPrefix}-${field.key}`;
  const label = t(field.labelKey);
  const errorMessage = error
    ? error === 'FIELD_TOO_LONG'
      ? t('pages.form.tooLong', { max: field.maxLength })
      : t('pages.form.required')
    : undefined;

  if (field.kind === 'list') {
    const items = Array.isArray(value) ? (value as SectionValues[]) : [];
    const update = (index: number, key: string, next: string) => {
      const copy = items.map((item, position) =>
        position === index ? { ...item, [key]: next } : item,
      );
      onChange(copy);
    };
    const move = (from: number, to: number) => {
      if (to < 0 || to >= items.length) return;
      const copy = [...items];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      onChange(copy);
    };

    return (
      <fieldset className="space-y-2" aria-describedby={errorMessage ? `${id}-error` : undefined}>
        <legend className="text-sm font-medium text-ink">
          {label}
          {field.required ? (
            <span className="ml-1 text-status-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </legend>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded-control border border-line bg-ivory/60 p-2"
              draggable={!disabled}
              onDragStart={(event) => {
                draggedIndex.current = index;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
                event.stopPropagation();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const from = draggedIndex.current;
                if (from !== null) move(from, index);
                draggedIndex.current = null;
              }}
              onDragEnd={() => {
                draggedIndex.current = null;
              }}
            >
              <div className="flex items-start gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  {(field.itemFields ?? []).map((itemField) => (
                    <Field
                      key={itemField.key}
                      id={`${id}-${index}-${itemField.key}`}
                      label={t(itemField.labelKey)}
                      required={itemField.required}
                      error={
                        error === 'FIELD_REQUIRED' && itemField.required
                          ? t('pages.form.required')
                          : undefined
                      }
                    >
                      {itemField.kind === 'textarea' ? (
                        <Textarea
                          id={`${id}-${index}-${itemField.key}`}
                          value={String(item[itemField.key] ?? '')}
                          maxLength={itemField.maxLength}
                          disabled={disabled}
                          onChange={(event) => update(index, itemField.key, event.target.value)}
                        />
                      ) : (
                        <Input
                          id={`${id}-${index}-${itemField.key}`}
                          value={String(item[itemField.key] ?? '')}
                          maxLength={itemField.maxLength}
                          disabled={disabled}
                          onChange={(event) => update(index, itemField.key, event.target.value)}
                        />
                      )}
                    </Field>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === 0}
                    aria-label={t('pages.form.moveItemUp', { index: index + 1 })}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === items.length - 1}
                    aria-label={t('pages.form.moveItemDown', { index: index + 1 })}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    aria-label={t('pages.form.removeItem')}
                    onClick={() => onChange(items.filter((_, position) => position !== index))}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {items.length === 0 && errorMessage ? (
          <p id={`${id}-error`} role="alert" className="text-xs font-medium text-status-danger">
            {errorMessage}
          </p>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...items, Object.fromEntries((field.itemFields ?? []).map((item) => [item.key, '']))])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t('pages.form.addItem')}
        </Button>
      </fieldset>
    );
  }

  return (
    <Field
      id={id}
      label={label}
      required={field.required}
      error={errorMessage}
      hint={field.maxLength ? t('pages.form.maxLength', { max: field.maxLength }) : undefined}
    >
      {field.kind === 'textarea' ? (
        <Textarea
          id={id}
          value={typeof value === 'string' ? value : ''}
          maxLength={field.maxLength}
          invalid={Boolean(error)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          maxLength={field.maxLength}
          invalid={Boolean(error)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}
