import { useId } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/src/components/ui';

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  file?: File | null;
  files?: File[];
  onChange: (files: FileList | null) => void;
}

export function FileUpload({
  label,
  accept,
  multiple,
  required,
  disabled,
  helperText,
  file,
  files,
  onChange,
}: FileUploadProps) {
  const inputId = useId();
  const selectedFiles = files && files.length ? files : file ? [file] : [];
  const summary = selectedFiles.length
    ? selectedFiles.length === 1
      ? selectedFiles[0].name
      : `${selectedFiles.length} files selected`
    : 'No file selected';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--tone-text)]">{label}{required ? ' *' : ''}</label>
      <label
        htmlFor={inputId}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--tone-border)] bg-white px-4 py-3 text-sm shadow-sm transition hover:border-[var(--tone-accent)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tone-surface-soft)] text-[var(--tone-text)]">
            <ImagePlus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--tone-text)]">Choose file</p>
            <p className="text-xs text-[var(--tone-text-muted)]">{summary}</p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--tone-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--tone-text)]">
          Browse
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.files)}
      />
      {helperText ? <p className="text-xs text-[var(--tone-text-muted)]">{helperText}</p> : null}
    </div>
  );
}
