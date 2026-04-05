import { useState, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface AvatarUploadProps {
  userId: number;
  currentAvatar: string;
  userName: string;
  onUpdated: (newUrl: string) => void;
}

export default function AvatarUpload({ userId, currentAvatar, userName, onUpdated }: AvatarUploadProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveAvatar(avatarUrl: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/users/${userId}/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Erro ao salvar foto.");
      }
      const data = await res.json();
      onUpdated(data.avatar_url);
      setOpen(false);
      setUrlInput("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Imagem muito grande. Máximo 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => saveAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) { setError("Cole uma URL de imagem."); return; }
    if (!urlInput.startsWith("http")) { setError("URL inválida."); return; }
    saveAvatar(urlInput.trim());
  }

  // Iniciais para fallback
  const initials = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Avatar clicável */}
      <div
        onClick={() => setOpen(true)}
        title="Alterar foto de perfil"
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          overflow: "hidden",
          cursor: "pointer",
          border: "3px solid rgba(124,58,237,0.5)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={userName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 700, color: "#fff",
          }}>
            {initials}
          </div>
        )}
        {/* Overlay de editar */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.2s",
          borderRadius: "50%",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
        >
          <span style={{ color: "#fff", fontSize: 22 }}>📷</span>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1a0a2e", border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: 16, padding: 28, width: "100%", maxWidth: 380,
              margin: "0 16px",
            }}
          >
            <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
              Alterar foto de perfil
            </h3>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["upload", "url"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: tab === t ? "#7c3aed" : "rgba(255,255,255,0.08)",
                    color: tab === t ? "#fff" : "#aaa",
                    transition: "all 0.2s",
                  }}
                >
                  {t === "upload" ? "📁 Fazer upload" : "🔗 Colar URL"}
                </button>
              ))}
            </div>

            {/* Upload */}
            {tab === "upload" && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(124,58,237,0.5)",
                    borderRadius: 12, padding: "32px 16px",
                    textAlign: "center", cursor: "pointer",
                    color: "#a78bfa", fontSize: 14,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontWeight: 600 }}>Clique para selecionar</div>
                  <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>JPG, PNG, GIF — máx. 2MB</div>
                </div>
              </div>
            )}

            {/* URL */}
            {tab === "url" && (
              <form onSubmit={handleUrlSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setError(""); }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(124,58,237,0.4)",
                    borderRadius: 8, padding: "10px 14px",
                    color: "#fff", fontSize: 14, outline: "none",
                    width: "100%", boxSizing: "border-box",
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "#fff", border: "none", borderRadius: 8,
                    padding: "11px", fontSize: 14, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Salvando..." : "Usar esta URL"}
                </button>
              </form>
            )}

            {error && (
              <p style={{
                color: "#f87171", fontSize: 13, marginTop: 12,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 6, padding: "8px 12px",
              }}>
                {error}
              </p>
            )}

            {loading && tab === "upload" && (
              <p style={{ color: "#a78bfa", fontSize: 13, marginTop: 12, textAlign: "center" }}>
                Salvando...
              </p>
            )}

            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: 16, width: "100%", padding: "9px",
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#666", fontSize: 13, cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
