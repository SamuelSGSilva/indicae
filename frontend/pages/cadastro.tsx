import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Cadastro() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', github: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Validação de Senha: Mín 8 caracteres, 1 Maiúscula, 1 Número
  const isPasswordStrong = (pass: string) => {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pass);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações de Interface conforme solicitado
    if (formData.name.trim().length < 3) return setError("Nome muito curto.");
    if (!formData.email.includes('@') || !formData.email.includes('.')) return setError("E-mail inválido.");
    if (!isPasswordStrong(formData.password)) return setError("Senha fraca! Use 8+ caracteres, uma maiúscula e um número.");
    if (formData.password !== formData.confirmPassword) return setError("As senhas não coincidem.");

    setLoading(true);
    try {
      // Ajuste a URL abaixo se o seu backend estiver em outro endereço
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/login?msg=sucesso');
      } else {
        const data = await res.json();
        setError(data.detail || "Erro ao cadastrar.");
      }
    } catch (err) {
      setError("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: '12px', textAlign: 'center', backgroundColor: '#fff' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Criar Conta no Indicae</h2>
      
      {/* Botão Google OAuth - Pluga no seu endpoint de login do Google */}
      <button 
        type="button"
        onClick={() => window.location.href = 'https://seu-backend.render.com/api/auth/google/login'}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" width="20" />
        Entrar com Google
      </button>

      <div style={{ margin: '15px 0', color: '#999', fontSize: '14px' }}>ou preencha os dados manuais</div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input style={inputStyle} type="text" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <input style={inputStyle} type="email" placeholder="Seu melhor e-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input style={inputStyle} type="text" placeholder="GitHub User (Opcional)" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} />
        <input style={inputStyle} type="password" placeholder="Senha (8+ chars, A-Z, 0-9)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        <input style={inputStyle} type="password" placeholder="Confirme sua Senha" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
        
        {error && <p style={{ color: '#ff4d4d', fontSize: '13px', margin: '5px 0' }}>{error}</p>}
        
        <button 
          disabled={loading}
          type="submit" 
          style={{ padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
        >
          {loading ? 'Processando...' : 'Finalizar Cadastro'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '15px',
  width: '100%',
  boxSizing: 'border-box' as const
};
