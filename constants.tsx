import { User, ConnectionRequest, Message } from './types';

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const SKILL_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-red-600', 'bg-orange-600', 'bg-amber-600',
  'bg-yellow-600', 'bg-lime-600', 'bg-green-600', 'bg-emerald-600',
  'bg-teal-600', 'bg-cyan-600', 'bg-sky-600', 'bg-blue-600',
  'bg-indigo-600', 'bg-violet-600', 'bg-purple-600', 'bg-fuchsia-600',
  'bg-pink-600', 'bg-rose-600', 'bg-slate-500', 'bg-gray-500'
];

export const getColorForSkill = (skill: string): string => {
    let hash = 0;
    for (let i = 0; i < skill.length; i++) {
        hash = skill.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % SKILL_COLORS.length);
    return SKILL_COLORS[index];
};


export const MOCK_CURRENT_USER_ID = '1'; // Alterado para string

export const ALL_HARD_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Angular', 'Vue.js', 'Node.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET', 'PHP', 'Laravel',
  'Ruby', 'Ruby on Rails', 'Go', 'Swift', 'Kotlin', 'SQL', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Firebase', 'AWS', 'Azure', 'Google Cloud Platform', 'Docker',
  'Kubernetes', 'Terraform', 'CI/CD', 'Git', 'HTML', 'CSS', 'Sass', 'Tailwind CSS',
  'GraphQL', 'REST APIs', 'DevOps', 'Big Data', 'Machine Learning', 
  'Inteligência Artificial', 'Data Science', 'Cybersecurity', 'Blockchain',
  'Edição de Vídeo', 'Cloud Computing'
];

export const ALL_SOFT_SKILLS = [
  'Comunicação', 'Trabalho em Equipe', 'Liderança', 'Proatividade', 'Resolução de Problemas',
  'Pensamento Crítico', 'Criatividade', 'Adaptabilidade', 'Gestão de Tempo',
  'Inteligência Emocional', 'Negociação', 'Persuasão', 'Empatia', 'Paciência',
  'Resiliência', 'Ética de Trabalho', 'Atenção aos Detalhes'
];

export const ALL_CITIES = [
  // Norte
  'Manaus', 'Belém', 'Porto Velho', 'Macapá', 'Rio Branco', 'Boa Vista', 'Palmas', 'Ananindeua',
  // Nordeste
  'Salvador', 'Fortaleza', 'Recife', 'São Luís', 'Maceió', 'Natal', 'Teresina',
  'João Pessoa', 'Aracaju', 'Feira de Santana', 'Jaboatão dos Guararapes',
  'Caucaia', 'Vitória da Conquista', 'Olinda', 'Campina Grande',
  // Centro-Oeste
  'Brasília', 'Goiânia', 'Campo Grande', 'Cuiabá', 'Aparecida de Goiânia',
  'Anápolis', 'Várzea Grande',
  // Sudeste
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Guarulhos', 'Campinas',
  'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto',
  'São José dos Campos', 'Sorocaba', 'Niterói', 'Duque de Caxias', 'São Gonçalo',
  'Nova Iguaçu', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Vitória',
  'Vila Velha', 'Serra',
  // Sul
  'Curitiba', 'Porto Alegre', 'Florianópolis', 'Joinville', 'Londrina', 'Caxias do Sul',
  'Maringá', 'Ponta Grossa', 'Cascavel', 'Pelotas', 'Foz do Iguaçu', 'Blumenau',
  'Santa Maria', 'Guarapuava', 'Umuarama', 'Chapecó', 'Medianeira', 'Missal',
  'São Miguel do Iguaçu', 'Santa Terezinha de Itaipu', 'Toledo', 'Campo Mourão',
  'Paranavaí', 'Apucarana', 'Colombo', 'São José dos Pinhais', 'Pinhais', 'Araucária',
].sort();

export const ALL_EDUCATION_COURSES = [
  'Administração',
  'ADS/Engenharia de Software',
  'Arquitetura e Urbanismo',
  'Agronomia',
  'Biomedicina',
  'Ciências Biológicas',
  'Ciência Contábeis',
  'Design Gráfico Digital',
  'Direito',
  'Educação Física',
  'Enfermagem',
  'Engenharia Civil',
  'Engenharia Elétrica',
  'Engenharia Mecânica',
  'Farmácia',
  'Fisioterapia',
  'Medicina Veterinária',
  'Nutrição',
  'Pedagogia',
  'Psicologia',
  'Publicidade e Propaganda',
].sort();


export const MOCK_USERS: User[] = [
  { id: '1', name: 'Jefferson Henrique', dob: '2002-04-15', city: 'Foz do Iguaçu', avatar: 'https://picsum.photos/id/1005/200/200', education: 'Engenharia de Software - Uniamérica Descomplica', softSkills: ['Liderança', 'Comunicação', 'Proatividade', 'Trabalho em Equipe'], hardSkills: ['DevOps', 'Big Data', 'Inteligência Artificial', 'React Native'], email: 'jefferson@indicai.com', password: '123' },
  { id: '2', name: 'Maria', dob: '2000-02-20', city: 'Cascavel', state: 'PR', avatar: 'https://picsum.photos/id/1011/200/200', hardSkills: ['Edição de Vídeo'], email: 'maria@example.com' },
  { id: '3', name: 'Ana Julia', dob: '2001-07-23', city: 'Foz do Iguaçu', state: 'PR', avatar: 'https://picsum.photos/id/1012/200/200', email: 'ana@example.com' },
  { id: '4', name: 'Hugo', dob: '2003-01-10', city: 'Foz do Iguaçu', state: 'PR', avatar: 'https://picsum.photos/id/1025/200/200', email: 'hugo@example.com' },
  { id: '5', name: 'Tiago', dob: '1998-05-30', city: 'Medianeira', state: 'PR', avatar: 'https://picsum.photos/id/1027/200/200', email: 'tiago@example.com' },
  { id: '6', name: 'Wellington', dob: '1995-09-05', city: 'Foz do Iguaçu', state: 'PR', avatar: 'https://picsum.photos/id/1035/200/200', email: 'wellington@example.com' },
  { id: '7', name: 'Walter', dob: '1996-11-12', city: 'Foz do Iguaçu', state: 'PR', avatar: 'https://picsum.photos/id/1037/200/200', email: 'walter@example.com' },
  { id: '8', name: 'Matheus', dob: '1994-03-01', city: 'Foz do Iguaçu', state: 'PR', avatar: 'https://picsum.photos/id/1040/200/200', email: 'matheus@example.com' },
  { id: '9', name: 'Vitoria', dob: '1994-06-18', city: 'Missal', state: 'PR', avatar: 'https://picsum.photos/id/1043/200/200', email: 'vitoria@example.com' },
  { id: '10', name: 'Beatriz Nogueira', dob: '1999-08-25', city: 'Curitiba', state: 'PR', avatar: 'https://picsum.photos/id/1028/200/200', email: 'beatriz@example.com' }
];

export const MOCK_CONNECTIONS: ConnectionRequest[] = [
  { id: '1', user: { id: '11', name: 'Davi Souza', dob: '1997-01-19', city: 'São Paulo', avatar: 'https://picsum.photos/id/21/200/200', email: 'davi@example.com' }, interest: 'Interesse em sua habilidade em React Native' },
  { id: '3', user: { id: '13', name: 'João Silva', dob: '1995-03-29', city: 'Belo Horizonte', avatar: 'https://picsum.photos/id/23/200/200', email: 'joao@example.com' }, interest: 'Interesse em sua habilidade em DevOps' },
  { id: '4', user: { id: '14', name: 'Maria', dob: '2000-02-20', city: 'Cascavel', avatar: 'https://picsum.photos/id/1011/200/200', email: 'maria2@example.com' }, interest: 'Interesse em sua habilidade edição de vídeo' },
  { id: '5', user: { id: '15', name: 'Silvio Abreu', dob: '1989-04-04', city: 'Brasília', avatar: 'https://picsum.photos/id/25/200/200', email: 'silvio@example.com' }, interest: 'Interesse em suas habilidades em Inteligência Artificial e DevOps' },
  { id: '6', user: { id: '16', name: 'Silvio Abreu', dob: '1989-04-04', city: 'Brasília', avatar: 'https://picsum.photos/id/25/200/200', email: 'silvio2@example.com' }, interest: 'Interesse em suas habilidades em Cloud' },
];

export const MOCK_CHAT_MESSAGES: Message[] = [
    { id: '1', text: 'Olá, bom dia tudo bem ?', time: '08:29', senderId: '10', avatar: MOCK_USERS[9].avatar },
    { id: '2', text: 'Olá, bom dia, tudo bem sim e com você?', time: '08:29', senderId: '1', avatar: MOCK_USERS[0].avatar },
    { id: '3', text: 'Estive analisando seu perfil e percebi algumas habilidades que se alinham perfeitamente com os requisitos da nossa vaga de estágio.', time: '08:30', senderId: '10', avatar: MOCK_USERS[9].avatar },
    { id: '4', text: 'Agradeço o contato e o interesse! Fiquei muito feliz em saber disso. Adoraria a oportunidade de saber mais detalhes sobre a vaga e a empresa.', time: '08:31', senderId: '1', avatar: MOCK_USERS[0].avatar },
    { id: '5', text: 'Perfeito, Jefferson! A oportunidade é para atuar no desenvolvimento de novas features do nosso app. Podemos marcar uma breve conversa de 30 minutos para alinharmos os detalhes. Você tem um horário livre amanhã ou quarta?', time: '08:32', senderId: '10', avatar: MOCK_USERS[9].avatar },
    { id: '6', text: 'Parece ótimo. Sim, podemos conversar. Tenho disponível na terça-feira às 14h ou na quinta pela manhã. Aguardo o convite com o link da chamada. Obrigado.', time: '08:33', senderId: '1', avatar: MOCK_USERS[0].avatar }
];

export const icons = {
  home: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  connections: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>,
  messages: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  profile: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  back: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  edit: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
  location: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  education: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>,
  softSkills: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a5.5 5.5 0 00-5.5 5.5c0 2.236 1.344 4.16 3.25 5.033V16.5a.5.5 0 00.5.5h3.5a.5.5 0 00.5-.5v-2.467c1.906-.873 3.25-2.797 3.25-5.033A5.5 5.5 0 0010 3.5zM12 15.5H8v-1h4v1zm-2-2.5a4.5 4.5 0 01-4.5-4.5A4.5 4.5 0 0110 4a4.5 4.5 0 014.5 4.5 4.5 4.5 0 01-4.5 4.5z" /><path d="M9 18.5a1 1 0 102 0 1 1 0 00-2 0z" /></svg>,
  hardSkills: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
  plus: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>,
  camera: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
  bell: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>,
  search: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  send: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>,
  ellipsis: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>,
  star: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  remove: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
  logout: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 0 01-3 3H6a3 0 01-3-3V7a3 0 013-3h4a3 0 013 3v1" /></svg>,
  share: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
  code: (className: string) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
};