# Tornar a app 100% pública (sem login)

## O que muda no comportamento

- Já não há páginas `/login`, `/signup`, `/reset-password`. A raiz `/` abre direto no Dashboard.
- Toda a gente que abrir o URL acede a tudo: Dashboard, Nova Ata, Histórico, Suporte, **e também todo o painel Admin** (Templates, Formatação, Preços, Pagamentos, Empresas, Utilizadores, Códigos, Tickets).
- Deixa de existir o conceito de "empresa do utilizador". A app passa a operar sobre **uma única empresa fixa** (a primeira/única na base de dados) para que templates, formatação, histórico e dívidas continuem a funcionar.
- A barra lateral deixa de mostrar email/empresa e o botão "Sair".

## O que vou alterar

### Frontend
- `src/App.tsx`: remover rotas de auth, remover `AuthProvider` e `ProtectedRoute`, redirecionar `/` → `/dashboard`. Todas as rotas (incluindo `/admin/*`) ficam públicas.
- Apagar: `src/pages/Login.tsx`, `Signup.tsx`, `ResetPassword.tsx`, `CodigoEmpresa.tsx`, `src/components/ProtectedRoute.tsx`, `src/hooks/useAuth.tsx`.
- `src/components/AppSidebar.tsx`: mostrar sempre o menu completo (empresa + admin juntos), tirar o "Sair" e a info de utilizador.
- Substituir todos os `useAuth()` espalhados pelas páginas por um hook simples `useCompany()` que carrega a primeira empresa de `companies` (ou cria uma "Empresa Padrão" se não existir) e devolve o `company_id`.

### Base de dados (migration)
- Reescrever as RLS de todas as tabelas (`atas`, `companies`, `company_formatting`, `company_templates`, `payments`, `support_tickets`, `ticket_messages`, `profiles`, `user_roles`) para permitir leitura/escrita ao role `anon` (público).
- Deixar `company_id` **opcional** (já é, na maioria) e os inserts passam a usar o id da empresa padrão obtido pelo frontend.
- Não apago as tabelas `profiles` / `user_roles` / `auth.users` — ficam órfãs mas inertes.

### Edge functions
- `signup-company`, `signup-employee`, `admin-users`: deixam de ser chamadas (posso apagá-las ou deixá-las inativas — vou apagar para limpar).
- `generate-ata` e restantes: removo qualquer dependência de `auth.uid()` / token de utilizador, passam a aceitar o `company_id` vindo do cliente.

## Riscos que aceitas ao avançar
- **Qualquer pessoa com o URL acede e altera tudo**, incluindo dívidas, preços, pagamentos, templates e tickets de suporte. Não há forma de saber quem fez o quê.
- Não dá para voltar atrás sem refazer auth + RLS de raiz.
- Histórico antigo de atas que esteja ligado a um `company_id` específico continua acessível, mas tudo o que criares de novo ficará na "empresa padrão" única.

Confirma e avanço com a implementação completa.
