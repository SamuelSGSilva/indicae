import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface AvatarUploadProps {
  userId: number;
  currentAvatar: string;
  userName: string;
  githubUsername?: string;
  onUpdated: (newUrl: string) => void;
}

export default function AvatarUpload({
  userId,
  currentAvatar,
  userName,
  githubUsername,
  onUpdated,
}: AvatarUploadProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "url" | "github">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState(currentAvatar);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Necessário para createPortal funcionar com SSR do Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-sincroniza avatar do GitHub se estiver vazio
  useEffect(() => {
    if (!githubUsername || avatar) return;
    fetch(`https://api.github.com/users/${githubUsername}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.avatar_url) {
          saveAvatar(data.avatar_url, true); // silent = true, não abre modal
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubUsername, avatar]);

  // Atualiza avatar local quando prop muda
  useEffect(() => {
    setAvatar(currentAvatar);
  }, [currentAvatar]);

  const initials = userName ? userName.charAt(0).toUpperCase() : "?";

  async function saveAvatar(avatarUrl: string, silent = false) {
    if (!silent) setLoading(true);
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
      setAvatar(data.avatar_url);
      onUpdated(data.avatar_url);
      if (!silent) setOpen(false);
      setUrlInput("");
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Imagem muito grande. Máximo 2MB."); return; }
    if (!file.type.startsWith("image/")) { setError("Selecione um arquivo de imagem válido."); return; }
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

  async function syncGithubAvatar() {
    if (!githubUsername) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://api.github.com/users/${githubUsername}`);
      if (!res.ok) throw new Error("Não foi possível buscar avatar do GitHub.");
      const data = await res.json();
      if (!data.avatar_url) throw new Error("Avatar não encontrado.");
      await saveAvatar(data.avatar_url);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  // Modal renderizado diretamente no body — evita problemas com transform/backdrop-filter do parent
  const modal = mounted && open ? createPortal(
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#1a0a2e",
          border: "1px solid rgba(124,58,237,0.4)",
          borderRadius: 16, padding: 28,
          width: "100%", maxWidth: 380,
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        }}
      >
        <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
          Alterar foto de perfil
        </h3>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {([
            { key: "upload", label: "📁 Upload" },
            { key: "url",    label: "🔗 URL" },
            ...(githubUsername ? [{ key: "github", label: "🐙 GitHub" }] : []),
          ] as { key: "upload" | "url" | "github"; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(""); }}
              style={{
                flex: 1, padding: "8px 0",
                borderRadius: 8, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: tab === t.key ? "#7c3aed" : "rgba(255,255,255,0.08)",
                color: tab === t.key ? "#fff" : "#aaa",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Upload */}
        {tab === "upload" && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed rgba(124,58,237,0.5)", borderRadius: 12,
                padding: "32px 16px", textAlign: "center", cursor: "pointer",
                color: "#a78bfa", fontSize: 14, transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontWeight: 600 }}>Clique para selecionar</div>
              <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>JPG, PNG, GIF — máx. 2MB</div>
            </div>
            {loading && <p style={{ color: "#a78bfa", fontSize: 13, marginTop: 12, textAlign: "center" }}>Salvando...</p>}
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
              type="submit" disabled={loading}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "11px", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Salvando..." : "Usar esta URL"}
            </button>
          </form>
        )}

        {/* GitHub */}
        {tab === "github" && githubUsername && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Buscar e salvar a foto do perfil{" "}
              <strong style={{ color: "#a78bfa" }}>@{githubUsername}</strong> no GitHub.
            </p>
            <button
              onClick={syncGithubAvatar} disabled={loading}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "12px 24px", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Buscando..." : "🐙 Usar foto do GitHub"}
            </button>
          </div>
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
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Avatar clicável */}
      <div
        onClick={() => setOpen(true)}
        title="Alterar foto de perfil"
        style={{
          width: 80, height: 80, borderRadius: "50%",
          overflow: "hidden", cursor: "pointer",
          border: "3px solid rgba(124,58,237,0.5)",
          position: "relative",
          animation: "pulse-glow 3s ease-in-out infinite",
        }}
      >
        {avatar ? (
          <img
            src={avatar} alt={userName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "var(--gradient-hero)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: "#fff",
          }}>
            {initials}
          </div>
        )}
        {/* Overlay de editar */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.2s", fontSize: 20,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
        >
          📷
        </div>
      </div>

      {/* Modal renderizado no body via portal */}
      {modal}
    </div>
  );
}
