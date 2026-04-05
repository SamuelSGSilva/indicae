import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://indicae-backend.onrender.com";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Digite seu email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Digite um email válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Erro ao processar. Tente novamente.");
        return;
      }
      setSent(true);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Esqueci minha senha — Indicae</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoWrap}>
            <span style={styles.logo}>indicae</span>
            <span style={styles.logoSub}>.</span>
          </div>

          {sent ? (
            /* Estado de sucesso */
            <div style={styles.successBox}>
              <div style={styles.successIcon}>📬</div>
              <h2 style={styles.title}>Verifique seu email</h2>
              <p style={styles.subtitle}>
                Se o email <strong>{email}</strong> estiver cadastrado, você
                receberá um link para redefinir sua senha em breve.
              </p>
              <p style={styles.hint}>
                Não recebeu? Verifique a caixa de spam ou{" "}
                <button
                  onClick={() => setSent(false)}
                  style={styles.linkBtn}
                >
                  tente novamente
                </button>
                .
              </p>
              <Link href="/login" style={styles.backLink}>
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            /* Formulário */
            <>
              <h2 style={styles.title}>Esqueceu sua senha?</h2>
              <p style={styles.subtitle}>
                Digite seu email e enviaremos um link para você criar uma nova
                senha.
              </p>

              <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  autoFocus
                  disabled={loading}
                />

                {error && <p style={styles.error}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.btn,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>

              <Link href="/login" style={styles.backLink}>
                ← Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)",
    padding: "24px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "16px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    backdropFilter: "blur(12px)",
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: "28px",
  },
  logo: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#a78bfa",
    letterSpacing: "-1px",
  },
  logoSub: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#7c3aed",
  },
  title: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 8px",
    textAlign: "center",
  },
  subtitle: {
    color: "#aaa",
    fontSize: "14px",
    textAlign: "center",
    margin: "0 0 24px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    color: "#ccc",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "-4px",
  },
  input: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "8px",
    padding: "11px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: {
    color: "#f87171",
    fontSize: "13px",
    margin: "0",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "6px",
    padding: "8px 12px",
  },
  btn: {
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: 700,
    marginTop: "4px",
    transition: "transform 0.1s, box-shadow 0.1s",
  },
  backLink: {
    display: "block",
    textAlign: "center",
    marginTop: "20px",
    color: "#a78bfa",
    fontSize: "13px",
    textDecoration: "none",
  },
  successBox: {
    textAlign: "center",
  },
  successIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  hint: {
    color: "#888",
    fontSize: "13px",
    marginTop: "16px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#a78bfa",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
    textDecoration: "underline",
  },
};
