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
  error?: string;
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
  error,
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
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-1.5 ml-1 block">{label}{required ? <span className="text-[var(--tone-accent)] ml-1">*</span> : ''}</label>
      <label
        htmlFor={inputId}
        className={cn(
          'i3d-btn group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-6 py-8 text-center transition-all hover:border-[var(--tone-accent)] hover:bg-[var(--tone-accent)]/5',
          disabled && 'cursor-not-allowed opacity-60 hover:border-[var(--tone-border)] hover:bg-[var(--tone-surface-soft)]',
          selectedFiles.length > 0 && 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 hover:bg-emerald-50',
          error && "border-red-500 bg-red-50/50 hover:border-red-600 hover:bg-red-50"
        )}
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          selectedFiles.length > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600"
        )}>
          <ImagePlus className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {selectedFiles.length > 0 ? 'File attached' : 'Upload an image'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{summary}</p>
        </div>
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
      {helperText && !error ? <p className="mt-1 ml-1 text-xs text-[var(--tone-text-muted)]">{helperText}</p> : null}
      {error && (
        <p className="mt-1.5 ml-1 text-xs font-bold text-red-500 animate-fade-up">
          {error}
        </p>
      )}
    </div>
  );
}
