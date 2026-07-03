# ARCH — EVENTOS + CALENDÁRIO MENSAL ("Agenda de Eventos")
Sistema A · Grau Técnico FSA · 02/07/2026 · **ARCH APROVADO pelo Bruno (3 decisões abaixo) — o chat de build executa sem redecidir.** Extensão do bloco N4; ler junto com `ARCH_N2N3N4_NOTURNO.md`.

## DECISÕES REGISTRADAS (02/07/2026)
- **D1 — Vínculo: projeto OPCIONAL.** Evento pode nascer solto no calendário e ser adotado por um projeto depois (1 edição). Benchmark: Asana (task sem projeto é estado nativo), Todoist (Inbox = captura sem projeto, GTD), Google Calendar (evento solto por natureza — referência visual enviada pelo Bruno); modelo container (ClickUp/Jira) descartado por custar cliques. Controle preservado: `siglaSetor` obrigatória + custos + realizado + `atividade_log` + RBAC.
- **D2 — Primeira tela: Meu Dia continua.** Botão **"Agenda de Eventos" PULSANTE** no topo do Meu Dia. Regra declarada: pulsa se `max(atualizadoEm)` dos eventos > `localStorage['graut_evt_lastSeen']` (por aparelho); abrir `eventos.html` grava o agora e o pulso para; volta a pulsar quando surgir evento novo/alterado. Custo da checagem: 1 read (`orderBy('atualizadoEm','desc') + limit(1)`). Animação por CSS com tokens; respeitar `prefers-reduced-motion`.
- **D3 — Custo: previsto + realizado** no evento; **projeto mostra a soma comparativa** (Σ previsto × Σ realizado dos eventos vinculados).

## COLEÇÃO `eventos`
```
eventos/{autoId} = {
  titulo: string,
  data: 'YYYY-MM-DD',            // dia civil local (Salvador) — Princípio timezone
  hora: 'HH:MM' | null,
  siglaSetor: string,            // OBRIGATÓRIA — acopla por SIGLA (Princípio 18)
  projetoId: string | null,      // D1: opcional
  local: string | null,
  obs: string | null,
  custoPrevisto: int,            // CENTAVOS (evita float); entrada com máscara R$; declarado no "i"
  custoRealizado: int | null,    // null = ainda não lançado
  realizado: boolean,
  criadoPorUid, criadoEm, atualizadoEm, ativo: true
}
```
**Rules (bloco a somar no firestore.rules REAL, com os helpers existentes):** read = autenticado ativo (todos os setores veem todos os eventos — pedido explícito); create/update = canWrite (Admin/Editor); delete = false (soft por `ativo`). Toda mutação registra em `atividade_log`.
**Queries:** sempre `where('ativo','==',true)` + `where('data','>=', primeiroDiaMes)` + `where('data','<=', ultimoDiaMes)` + `limit(200)`.

## TELA `eventos.html` (nova · mobile-first · referência: screenshot Google Calendar do Bruno)
1. Topo: pílulas de meses roláveis (jun · jul · ago …) + título do mês + navegação ‹ ›.
2. Grade 7 colunas **D S T Q Q S S**; dias fora do mês esmaecidos; **hoje** com círculo destacado (token de acento do theme real).
3. Evento = chip no dia com a **cor do setor** (paleta de 8 tokens — zero hex fora do theme.css); 2+ eventos → chips empilhados + "+n".
4. Toque no dia → painel inferior (bottom sheet) com os eventos: título, chip do setor, hora, local, **R$ previsto × R$ realizado**, badge Realizado/Previsto, link "abrir projeto" quando vinculado, botões editar/marcar realizado (Admin/Editor).
5. Botão **+** (Admin/Editor): modal padrão — título, data, hora?, setor (select de siglas ativas), projeto (select opcional), custo previsto, obs.
6. **"i"** no cabeçalho: o que o calendário mostra (eventos ativos do mês, todos os setores) + a regra do pulso + a regra dos custos em centavos.
7. Estados: carregando · vazio ("Nenhum evento neste mês — toque em + para criar") · erro · sem-permissão.
8. Rota `'Eventos'` no guard.js + item no menu.

## INTEGRAÇÃO COM PROJETOS (N4)
- `projetos.html`: aba **Eventos** do projeto (lista + criar já vinculado) + card "Custos dos eventos: R$ previsto × R$ realizado" (soma client-side dos eventos do `projetoId`).
- Evento solto → pode ser vinculado depois editando o campo projeto.

## TOQUES EM ARQUIVOS EXISTENTES (patches cirúrgicos — exigem os arquivos REAIS de produção)
- `hoje.html`: botão pulsante no topo + função de checagem (1 read). — depende do hoje.html NOVO estar disponível.
- `guard.js`: rota Eventos. `login.html`: **sem mudança** (Meu Dia segue 1ª tela — D2).
- `firestore.rules`: bloco `eventos`. `theme.css`: nenhum hex novo; se precisar, só variável de animação do pulso.

## ORDEM NO MODO NOTURNO
Entra como **N4-B** (após projetos/reuniões N4-A). Como `projetoId` é opcional, PODE ser antecipado como bloco independente se o Bruno priorizar — padrão: junto do N4.

## EMENDA AO PROMPT DO PRÓXIMO CHAT (colar junto do prompt do HANDOFF_NOTURNO_02JUL.md)
"N4 inclui também EVENTOS + CALENDÁRIO MENSAL conforme `ARCH_EVENTOS_CALENDARIO.md` no Conhecimento — decisões D1/D2/D3 já aprovadas em 02/07, NÃO redecidir. No PASSO 0, conferir também a presença deste arquivo."
