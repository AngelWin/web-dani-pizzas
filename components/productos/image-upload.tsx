"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  value?: string | null;
  categoriaId?: string | null;
  onChange: (url: string | null) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  categoriaId,
  onChange,
  onUploadingChange,
  disabled,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadImage = useCallback(
    async (file: File) => {
      setIsUploading(true);
      onUploadingChange?.(true);
      setUploadError(null);

      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "jpg";
        const uuid = crypto.randomUUID();
        const folder = categoriaId ?? "sin-categoria";
        const path = `${folder}/${uuid}.${ext}`;

        const uploadPromise = supabase.storage
          .from("productos")
          .upload(path, file, { upsert: false });

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Tiempo de espera agotado (30s)")),
            30000,
          ),
        );

        const { error: uploadErr } = await Promise.race([
          uploadPromise,
          timeout,
        ]);

        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from("productos").getPublicUrl(path);

        onChange(data.publicUrl);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Error al subir la imagen",
        );
      } finally {
        setIsUploading(false);
        onUploadingChange?.(false);
      }
    },
    [categoriaId, onChange, onUploadingChange],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("El archivo debe ser una imagen");
        return;
      }
      uploadImage(file);
    },
    [uploadImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
    setUploadError(null);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted aspect-video">
          <Image
            src={value}
            alt="Vista previa del producto"
            fill
            className="object-cover"
            unoptimized
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1 shadow hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            !disabled && !isUploading && "cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {isUploading ? (
            <>
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Subiendo imagen...
              </p>
            </>
          ) : (
            <>
              <div className="mb-3 rounded-full bg-muted p-3">
                {isDragging ? (
                  <ImageIcon className="h-6 w-6 text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium">
                {isDragging
                  ? "Suelta la imagen aquí"
                  : "Haz clic o arrastra una imagen"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, WEBP, GIF, AVIF y más formatos
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
    </div>
  );
}
