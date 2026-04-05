import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_URL || "https://indicae-backend.onrender.com";

type PageState = "validating" | "valid" | "invalid" | "success";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color = score === 0 ? "#555" : score === 1 ? "#ef4444" : score === 2 ? "#f59e0b" : "#22c55e";
  const label = score === 0 ? "" : score === 1 ? "Fraca" : score === 2 ? "Média" : "Forte";

  if (!password) return null;

  return (
    <div style={{ marginTop: "4px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: i <= score ? color : "#333",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {checks.map((c) => (
          <span
            key={c.label}
            style={{ fontSize: "11px", color: c.ok ? "#22c55e" : "#666" }}
          >
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
        {label && (
          <span style={{ fontSize: "11px", color, marginLeft: "auto", fontWeight: 600 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RedefinirSenha() {
  const router = useRouter();
  const { token } = router.query as { token?: string };

  const [pageState, setPageState] = useState<PageState>("validating");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Valida o token assim que a página carrega
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/auth/reset-password/validate?token=${token}`)
      .then((r) => {
        if (r.ok) setPageState("valid");
        else setPageState("invalid");
      })
      .catch(() => setPageState("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("A senha deve conter pelo menos uma letra maiúscula.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("A senha deve conter pelo menos um número.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Erro ao redefinir senha. Tente novamente.");
        return;
      }
      setPageState("success");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Redefinir senha — Indicae</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoWrap}>
            <span style={styles.logo}>indicae</span>
            <span style={styles.logoSub}>.</span>
          </div>

          {/* Validando token */}
          {pageState === "validating" && (
            <div style={styles.center}>
              <div style={styles.spinner} />
              <p style={styles.subtitle}>Verificando link...</p>
            </div>
          )}

          {/* Token inválido/expirado */}
          {pageState === "invalid" && (
            <div style={styles.center}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>⛔</div>
              <h2 style={styles.title}>Link inválido ou expirado</h2>
              <p style={styles.subtitle}>
                Este link de redefinição não é mais válido. Os links expiram em
                1 hora após o envio.
              </p>
              <Link href="/esqueci-senha" style={styles.btn}>
                Solicitar novo link
              </Link>
              <Link href="/login" style={styles.backLink}>
                ← Voltar para o login
              </Link>
            </div>
          )}

          {/* Formulário */}
          {pageState === "valid" && (
            <>
              <h2 style={styles.title}>Criar nova senha</h2>
              <p style={styles.subtitle}>
                Escolha uma senha forte para sua conta.
              </p>

              <form onSubmit={handleSubmit} style={styles.form}>
                {/* Nova senha */}
                <label style={styles.label}>Nova senha</label>
                <div style={styles.inputWrap}>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={styles.eyeBtn}
                    tabIndex={-1}
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
                <PasswordStrength password={password} />

                {/* Confirmar senha */}
                <label style={{ ...styles.label, marginTop: "8px" }}>
                  Confirmar senha
                </label>
                <div style={styles.inputWrap}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor:
                        confirm && confirm !== password
                          ? "rgba(239,68,68,0.6)"
                          : "rgba(124,58,237,0.4)",
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={styles.eyeBtn}
                    tabIndex={-1}
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <span style={{ fontSize: "12px", color: "#f87171" }}>
                    As senhas não coincidem
                  </span>
                )}

                {error && <p style={styles.error}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitBtn,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            </>
          )}

          {/* Sucesso */}
          {pageState === "success" && (
            <div style={styles.center}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎉</div>
              <h2 style={styles.title}>Senha redefinida!</h2>
              <p style={styles.subtitle}>
                Sua senha foi alterada com sucesso. Agora você pode fazer login
                com a nova senha.
              </p>
              <Link href="/login" style={styles.btn}>
                Ir para o login
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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
  logoWrap: { textAlign: "center", marginBottom: "28px" },
  logo: { fontSize: "28px", fontWeight: 800, color: "#a78bfa", letterSpacing: "-1px" },
  logoSub: { fontSize: "28px", fontWeight: 800, color: "#7c3aed" },
  title: { color: "#fff", fontSize: "20px", fontWeight: 700, margin: "0 0 8px", textAlign: "center" },
  subtitle: { color: "#aaa", fontSize: "14px", textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 },
  center: { textAlign: "center" },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(124,58,237,0.3)",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 16px",
  },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#ccc", fontSize: "13px", fontWeight: 600 },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  input: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "8px",
    padding: "11px 40px 11px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: 0,
    lineHeight: 1,
  },
  error: {
    color: "#f87171",
    fontSize: "13px",
    margin: "4px 0",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "6px",
    padding: "8px 12px",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: 700,
    marginTop: "8px",
  },
  btn: {
    display: "inline-block",
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    marginTop: "8px",
  },
  backLink: {
    display: "block",
    textAlign: "center",
    marginTop: "16px",
    color: "#a78bfa",
    fontSize: "13px",
    textDecoration: "none",
  },
};
