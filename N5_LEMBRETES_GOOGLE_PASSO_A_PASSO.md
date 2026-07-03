# N5 — LEMBRETES VIA GOOGLE CALENDAR · PASSO A PASSO DO OAUTH (Bruno executa, ~10 min)
Sistema A · Grau Técnico FSA · jul/2026

**O que isto habilita:** o botão "Conectar Google Calendar" no Meu Dia — listar seus compromissos do dia e criar lembretes (eventos com alarme) direto do sistema.
**O que NÃO fazer agora:** ligar a flag do `gcal.js`. O código já está entregue e DESLIGADO (`ATIVO = false`). A ativação é um passo futuro, combinado em chat, depois que este cadastro estiver pronto.
**Por que "Interno":** sua conta é Google Workspace (`@grautecnico.com.br`). Consentimento tipo **Interno** vale só para contas do seu domínio e **dispensa a verificação de app do Google** (sem revisão, sem tela de "app não verificado").

---

## PARTE 1 — Projeto e API (Google Cloud Console)

1. Abra `console.cloud.google.com` logado com a conta **@grautecnico.com.br** (a de administrador do Workspace).
   *Resultado esperado:* painel do Google Cloud aberto.
2. No topo, clique no seletor de projeto → **Novo projeto** → nome: `Grau Agenda Lembretes` → **Criar** → aguarde e **selecione** esse projeto no seletor.
   *Resultado esperado:* o nome `Grau Agenda Lembretes` aparece no topo da tela.
3. Menu ☰ → **APIs e serviços** → **Biblioteca** → busque `Google Calendar API` → clique nela → **Ativar**.
   *Resultado esperado:* a página muda para "API ativada" com botão Gerenciar.

## PARTE 2 — Tela de consentimento (Interno)

4. Menu ☰ → **APIs e serviços** → **Tela de permissão OAuth** (OAuth consent screen).
5. Tipo de usuário: marque **Interno** → **Criar**.
   *Se "Interno" não aparecer:* você não está num projeto da organização Workspace — volte ao passo 2 e confira se criou o projeto logado na conta @grautecnico.com.br (campo "Organização" deve mostrar grautecnico.com.br).
6. Preencha: Nome do app `Agenda Grau Técnico` · E-mail de suporte: o seu · E-mail de contato do desenvolvedor: o seu → **Salvar e continuar** nas telas seguintes (não precisa adicionar escopos aqui; o app pede em tempo de execução).
   *Resultado esperado:* status da tela de consentimento = "Em produção" (interno não tem fase de teste).

## PARTE 3 — Client ID (a credencial)

7. Menu ☰ → **APIs e serviços** → **Credenciais** → **+ Criar credenciais** → **ID do cliente OAuth**.
8. Tipo de aplicativo: **Aplicativo da Web** · Nome: `Sistema A Netlify`.
9. Em **Origens JavaScript autorizadas** → **Adicionar URI** → cole exatamente:
   `https://agendagestaograutecnico.netlify.app`
   (sem barra no final; não preencha "URIs de redirecionamento" — o fluxo por token não usa).
10. **Criar** → uma janela mostra o **ID do cliente** (termina em `.apps.googleusercontent.com`). **Copie e me mande no chat** (Client ID não é segredo; não existe "client secret" para app Web nesse fluxo).
    *Resultado esperado:* a credencial listada em "IDs do cliente OAuth 2.0".

## PARTE 4 — O que acontece depois (comigo, em chat)

11. Eu colo o Client ID na constante `CLIENT_ID` do `gcal.js`, ligo `ATIVO = true`, integro o botão no Meu Dia e te entrego o arquivo final consolidado + roteiro de teste.
12. No 1º clique em "Conectar", o Google abre o popup de consentimento **uma única vez por usuário**; depois é silencioso. O token vive ~1h só na memória da aba (nada salvo no navegador) e renova em 1 clique.

---

## Ficha técnica (para auditoria)
- Modelo: Google Identity Services · token model (fluxo implícito), client-side only, popup, sem backend, sem refresh token.
- Escopo pedido: `https://www.googleapis.com/auth/calendar.events` (ler e criar eventos do próprio usuário).
- Chamadas: REST direto `https://www.googleapis.com/calendar/v3/...` com `Authorization: Bearer` (sem biblioteca gapi.client).
- Fuso: datas montadas com offset local dinâmico (Salvador = `-03:00`), sem UTC cru.
- Proibições N5 vigentes: **sem OAuth ativado, sem service worker**.
- Fontes: developers.google.com/identity/oauth2/web/guides/use-token-model · developers.google.com/workspace/calendar/api/quickstart/js (jun/2026).
