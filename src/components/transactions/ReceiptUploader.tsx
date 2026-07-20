import { useCallback, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStorageService } from "@/services/service-provider";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ReceiptUploaderProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  error?: string;
}

export function ReceiptUploader({ value, onChange, disabled, error }: ReceiptUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Only JPG, JPEG, PNG, and WEBP files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must be less than 5MB.");
      return;
    }

    setUploading(true);

    try {
      const service = getStorageService();
      const result = await service.upload(file);
      onChange(result.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange("");
    setUploadError(null);
  };

  const displayError = uploadError ?? error;

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <img
            src={value}
            alt="Receipt preview"
            className="w-full h-48 object-contain bg-muted/30"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              title="Replace receipt"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              disabled={disabled || uploading}
              onClick={handleRemove}
              title="Remove receipt"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30",
            disabled && "cursor-not-allowed opacity-60",
            displayError && "border-destructive/50",
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled && !uploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleInputChange}
            disabled={disabled || uploading}
          />
          <div className="rounded-full bg-muted p-2">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-0.5">
            {uploading ? (
              <p className="text-sm text-muted-foreground">Uploading receipt...</p>
            ) : (
              <>
                <p className="text-sm font-medium">Drop receipt here or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  JPG, JPEG, PNG, or WEBP (max 5MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
    </div>
  );
}
