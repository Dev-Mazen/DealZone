import { useState, useRef, useCallback, useId } from "react";
import {
  UploadCloud,
  X,
  FileText,
  Image,
  File,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileCategory(file) {
  const { type, name } = file;
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/")) return "image";
  return "other";
}

function FileIcon({ file }) {
  const category = getFileCategory(file);
  const configs = {
    pdf: {
      Icon: FileText,
      bg: "bg-red-100",
      text: "text-red-600",
    },
    image: {
      Icon: Image,
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    other: {
      Icon: File,
      bg: "bg-slate-100",
      text: "text-slate-500",
    },
  };
  const { Icon, bg, text } = configs[category];
  return (
    <span
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}
      aria-hidden="true"
    >
      <Icon className={`h-5 w-5 ${text}`} />
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function FileUpload({
  onFilesChange,
  accept,
  maxSize = 10485760, // 10 MB
  multiple = false,
  maxFiles = 5,
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  error: externalError,
  label = "Upload Files",
  hint,
  className = "",
}) {
  const inputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const inputId = useId();

  const [files, setFiles] = useState([]); // File[]
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState("");

  const error = externalError || internalError;
  const isMaxReached = files.length >= maxFiles;
  const isDisabled = disabled || isMaxReached;

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateFiles = useCallback(
    (incoming) => {
      const errors = [];
      const valid = [];

      // Determine how many slots remain
      const slots = multiple ? maxFiles - files.length : 1;
      const candidates = Array.from(incoming).slice(0, slots);

      for (const file of candidates) {
        // Size check
        if (file.size > maxSize) {
          errors.push(
            `"${file.name}" exceeds the ${formatBytes(maxSize)} limit.`
          );
          continue;
        }

        // Type check (only when accept is provided)
        if (accept) {
          const accepted = accept.split(",").map((s) => s.trim());
          const matchesType = accepted.some((pattern) => {
            if (pattern.startsWith(".")) {
              return file.name.toLowerCase().endsWith(pattern.toLowerCase());
            }
            if (pattern.endsWith("/*")) {
              return file.type.startsWith(pattern.replace("/*", "/"));
            }
            return file.type === pattern;
          });
          if (!matchesType) {
            errors.push(`"${file.name}" is not an accepted file type.`);
            continue;
          }
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [accept, maxSize, multiple, maxFiles, files.length]
  );

  const addFiles = useCallback(
    (incoming) => {
      setInternalError("");
      const { valid, errors } = validateFiles(incoming);

      if (errors.length) {
        setInternalError(errors.join(" "));
      }

      if (!valid.length) return;

      const next = multiple ? [...files, ...valid] : valid.slice(0, 1);
      setFiles(next);
      onFilesChange?.(next);
    },
    [files, multiple, validateFiles, onFilesChange]
  );

  const removeFile = useCallback(
    (index) => {
      const next = files.filter((_, i) => i !== index);
      setFiles(next);
      setInternalError("");
      onFilesChange?.(next);
    },
    [files, onFilesChange]
  );

  const clearAll = useCallback(() => {
    setFiles([]);
    setInternalError("");
    onFilesChange?.([]);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFilesChange]);

  // ── Drag Handlers ──────────────────────────────────────────────────────────

  const handleDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) setIsDragOver(true);
    },
    [isDisabled]
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) setIsDragOver(true);
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the drop zone itself (not a child)
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (isDisabled) return;
      const { files: dropped } = e.dataTransfer;
      if (dropped?.length) addFiles(dropped);
    },
    [isDisabled, addFiles]
  );

  // ── Input Change ───────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e) => {
      const { files: picked } = e.target;
      if (picked?.length) addFiles(picked);
      // Reset input so selecting the same file again works
      e.target.value = "";
    },
    [addFiles]
  );

  // ── Keyboard ───────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e) => {
      if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [isDisabled]
  );

  // ── Zone appearance ────────────────────────────────────────────────────────

  const zoneBase =
    "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-2";

  let zoneVariant = "";
  if (disabled) {
    zoneVariant = "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60";
  } else if (error) {
    zoneVariant = "border-[#EF4444] bg-red-50";
  } else if (isMaxReached) {
    zoneVariant =
      "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60";
  } else if (isDragOver) {
    zoneVariant =
      "border-[#00D9F5] bg-[#EAF4FF] scale-[1.01] shadow-md";
  } else {
    zoneVariant = "border-slate-300 bg-white hover:border-[#1266D6] hover:bg-[#EAF4FF]/40";
  }

  const hintText =
    hint ||
    (accept
      ? `${accept.replace(/,/g, ", ")} up to ${formatBytes(maxSize)}`
      : `Up to ${formatBytes(maxSize)} per file`);

  return (
    <div className={`w-full ${className}`}>
      {/* ── Drop Zone ───────────────────────────────────────────────────── */}
      <div
        ref={dropZoneRef}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={`${label}. ${hintText}. ${isMaxReached ? "Maximum number of files reached." : "Press Enter or Space to browse."}`}
        aria-disabled={isDisabled}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`${zoneBase} ${zoneVariant}`}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={isDisabled}
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Upload Cloud Icon */}
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-200 ${
            isDragOver ? "bg-[#00D9F5]/20" : "bg-[#EAF4FF]"
          }`}
          aria-hidden="true"
        >
          <UploadCloud
            className={`h-7 w-7 transition-colors duration-200 ${
              isDragOver ? "text-[#00D9F5]" : "text-[#06245B]"
            }`}
          />
        </span>

        {/* Text content */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            {isDragOver
              ? "Release to upload"
              : isMaxReached
              ? "Maximum files reached"
              : label}
          </p>

          {!isMaxReached && (
            <p className="text-sm text-slate-500">
              Drag & drop or{" "}
              <span className="font-medium text-[#00D9F5] underline underline-offset-2">
                click to browse
              </span>
            </p>
          )}

          <p className="text-xs text-slate-400">{hintText}</p>

          {multiple && maxFiles && (
            <p className="text-xs text-slate-400">
              {files.length} / {maxFiles} files selected
            </p>
          )}
        </div>

        {/* Success overlay */}
        {isUploading && uploadProgress === 100 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 backdrop-blur-sm">
            <CheckCircle2 className="h-8 w-8 text-[#10B981]" />
            <span className="text-sm font-medium text-[#10B981]">
              Upload complete!
            </span>
          </div>
        )}
      </div>

      {/* ── Error Message ────────────────────────────────────────────────── */}
      {error && (
        <div
          id={`${inputId}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-sm text-[#EF4444]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── File List ────────────────────────────────────────────────────── */}
      {files.length > 0 && (
        <ul
          className="mt-3 space-y-2"
          aria-label="Selected files"
          role="list"
        >
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* File type icon */}
              <FileIcon file={file} />

              {/* Name + size */}
              <div className="min-w-0 flex-1">
                <p
                  className="max-w-[200px] truncate text-sm font-medium text-slate-700 sm:max-w-xs"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>

                {/* Progress bar */}
                {isUploading && uploadProgress < 100 && (
                  <div className="mt-1.5">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading ${file.name}: ${uploadProgress}%`}
                    >
                      <div
                        className="h-full rounded-full bg-[#00D9F5] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-xs text-slate-400">
                      {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Upload complete indicator per file */}
                {isUploading && uploadProgress === 100 && (
                  <div className="mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                    <span className="text-xs font-medium text-[#10B981]">
                      Uploaded
                    </span>
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={isUploading}
                className="flex-shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Clear All button ──────────────────────────────────────────────── */}
      {files.length > 1 && !isUploading && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label="Remove all files"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
export { FileUpload };
