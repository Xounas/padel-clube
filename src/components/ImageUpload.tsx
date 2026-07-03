"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Upload de imagem para o bucket "raquetes" (Supabase Storage) e devolve a URL
 * pública via onChange. Guarde a URL num campo/estado do formulário.
 */
export function ImageUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErro(null);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("raquetes")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("raquetes").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      setErro(err?.message ?? "Falha no upload da imagem");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {value && (
        <img
          src={value}
          alt="Raquete"
          style={{
            width: "100%",
            maxHeight: 160,
            objectFit: "contain",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--bg-soft)",
          }}
        />
      )}
      <label className="btn btn-ghost small" style={{ cursor: "pointer" }}>
        {uploading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
        <input
          type="file"
          accept="image/*"
          onChange={handle}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>
      {erro && (
        <div className="badge badge-danger" style={{ padding: "6px 10px" }}>
          {erro}
        </div>
      )}
    </div>
  );
}
