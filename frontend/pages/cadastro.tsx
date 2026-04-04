import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Cadastro() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    github: '', 
    bio: '', 
    skills: '', 
    role: 'Dev' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isPasswordStrong = (pass: string) => {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pass);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.name.trim().length < 3) return setError("Nome muito curto.");
    if (!formData.email.includes('@')) return setError("E-mail inválido.");
    if (!isPasswordStrong(formData.password)) return setError("Senha deve ter 8+ caracteres, uma maiúscula e um número.");
    if (formData.password !== formData.confirmPassword) return setError("As senhas não coincidem.");

    setLoading(true);
    try {
      const res = await fetch('https://indicae-backend.onrender.com/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) router.push('/login?msg=sucesso');
      else {
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
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <span style={{ color: '#A855F7', fontSize: '24px' }}>◆</span>
          <h1 style={titleStyle}>INDICAE</h1>
        </div>
        
        <p style={subtitleStyle}>Crie sua conta na Malha</p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={inputGroup}>
            <label style={labelStyle}>Nome</label>
            <input style={inputStyle} type="text" placeholder="seu nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>E-mail</label>
            <input style={inputStyle} type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>GitHub User</label>
            <input style={inputStyle} type="text" placeholder="@usuario" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Senha</label>
            <input style={inputStyle} type="password" placeholder="********" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Confirmar Senha</label>
            <input style={inputStyle} type="password" placeholder="********" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Bio / Descrição</label>
            <textarea style={{...inputStyle, minHeight: '60px', resize: 'none'}} placeholder="Conte um pouco sobre você..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Habilidades (separadas por vírgula)</label>
            <input style={inputStyle} type="text" placeholder="React, Node, Python..." value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Perfil</label>
            <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Dev">Desenvolvedor</option>
              <option value="B2C">Empresa/B2C</option>
            </select>
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <button disabled={loading} type="submit" style={btnPrimaryStyle}>
            {loading ? 'Processando...' : 'Cadastrar'}
          </button>
        </form>

        <div style={dividerContainer}>
          <div style={line}></div>
          <span style={dividerText}>ou</span>
          <div style={line}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button type="button" onClick={() => window.location.href = 'https://indicae-backend.onrender.com/api/auth/google/login'} style={btnSecondaryStyle}>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="18" alt="G" />
            Entrar com Google
          </button>

          <button type="button" onClick={() => window.location.href = 'https://indicae-backend.onrender.com/api/auth/github/login'} style={btnSecondaryStyle}>
            <svg height="18" viewBox="0 0 16 16" width="18" fill="white">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            Entrar com GitHub
          </button>
        </div>

        <p style={footerTextStyle}>
          Já tem conta? <Link href="/login"><span style={linkStyle}>Entrar</span></Link>
        </p>
      </div>
    </div>
  );
}

// ESTILOS ATUALIZADOS
const containerStyle = { 
  backgroundColor: '#0F1117', 
  minHeight: '100vh', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontFamily: 'sans-serif', 
  padding: '20px 10px' 
};

const cardStyle = { 
  backgroundColor: '#161B22', 
  padding: '30px 40px', 
  borderRadius: '24px', 
  border: '1px solid #30363D', 
  width: '100%', 
  maxWidth: '420px', 
  textAlign: 'center' as const, 
  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  maxHeight: '90vh', // Garante que não fuja da tela no mobile
  overflowY: 'auto' as const // Adiciona rolagem se a tela for pequena
};

const logoStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' };
const titleStyle = { color: '#6366F1', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px', margin: 0 };
const subtitleStyle = { color: '#8B949E', fontSize: '14px', marginBottom: '20px' };
const inputGroup = { textAlign: 'left' as const, display: 'flex', flexDirection: 'column' as const, gap: '4px' };
const labelStyle = { color: '#C9D1D9', fontSize: '12px', marginLeft: '4px' };
const inputStyle = { backgroundColor: '#0D1117', border: '1px solid #30363D', borderRadius: '12px', padding: '10px 14px', color: '#C9D1D9', fontSize: '13px', outline: 'none' };
const btnPrimaryStyle = { backgroundColor: '#6366F1', backgroundImage: 'linear-gradient(45deg, #6366F1, #8B5CF6)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' };
const dividerContainer = { display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' };
const line = { flex: 1, height: '1px', backgroundColor: '#30363D' };
const dividerText = { color: '#484F58', fontSize: '11px', textTransform: 'uppercase' as const };
const btnSecondaryStyle = { backgroundColor: '#161B22', color: 'white', border: '1px solid #30363D', borderRadius: '12px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' };
const errorStyle = { color: '#F85149', fontSize: '12px', margin: '0' };
const footerTextStyle = { color: '#8B949E', fontSize: '13px', marginTop: '20px' };
const linkStyle = { color: '#A855F7', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' };
