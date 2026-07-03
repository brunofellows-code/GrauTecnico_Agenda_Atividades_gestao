# ARCH NOTURNO — N2 · N3 · N4 (benchmark + veredito + contrato de build)
Sistema A · Grau Técnico FSA · 02/07/2026 · Vale como ARCH aprovado ("vai" permanente do modo noturno). O próximo chat EXECUTA isto sem redecidir.

---

## N2 — KPIs INTELIGENTES (kpi.js + inteligencia.html + firestore.rules)

**Benchmark (web, 02/07):** Tabular Editor (KPI card = valor + gap absoluto E direção + tendência; "acima da meta caindo ≠ acima da meta acelerando"), ClearPoint (semáforo com cor INVERTIDA quando menor=melhor — atrasadas/aging/reprog), UXPilot/datawireframe (4–6 cards em foco, sparkline word-sized, F-pattern), FanRuan (verde=meta, âmbar=alerta, vermelho=ação). **Veredito:** card = valor + Δ7d (pontos, com seta e cor invertível) + sparkline 14 pts + "i" com fórmula e dados; score composto por setor com pesos declarados; sem histórico → rótulo honesto "coletando X/7", nunca tendência inventada. 6/6 fontes convergem.

**Matemática JÁ VALIDADA (27/27 no harness desta noite — `kpi_ext_n2.js` + `harness_n2.js`):**
- `_score(ader, pctAtrasadas, agingMedio)` → 0–100. Pesos no "i": aderência 50 · atrasadas 30 · aging 20. compB = 100−%atrasadas; compC = 100−aging×12,5 (0d=100 · 4d=50 · 8d+=0). Semáforo ≥80 ok · 60–79 warn · <60 bad.
- `_gargalos(setores)` → regra explícita: aderência<80 **OU** (atrasadas>0 **E** aging≥4d **E** carga>1,5×mediana). Motivo em texto pronto para o Plano de ação.
- `_trend(snapshots, chave, hoje)` → base = snapshot mais recente com data ≤ hoje−7d; sem base → `{suficiente:false, coletando:'X/7'}`.
- `_deltaFmt(delta, menorMelhor)` → texto '+3'/'-2'/'0' + tom ok/bad/flat (inversão ClearPoint).
- `_sparkPoints(valores, w, h)` → atributo `points` de `<polyline>`; ≤14 pts; constante → linha no meio; <2 pts → ''.
**MERGE, NÃO REESCREVER:** estas funções entram no `kpi.js` real como `KPI._score`, `KPI._gargalos`, `KPI._mediana`, `KPI._trend`, `KPI._deltaFmt`, `KPI._sparkPoints`, `KPI._dataMenos` — corpo idêntico ao validado.

**Coleção `kpi_snapshots`** — 1 doc/dia, id = `YYYY-MM-DD`:
```
{ data:'YYYY-MM-DD', criadoEm:<serverTimestamp>, criadoPorUid:<uid>,
  aderencia:<int>, atrasadas:<int>, pctAtrasadas:<int>, agingMedio:<num>,
  abertas:<int>, andamento:<int>, throughputSemana:<int>, reprogPct:<int>,
  porSetor:{ SIGLA:{ ader:<int>, atrasadas:<int>, agingMedio:<num>, carga:<int> } } }
```
Acoplamento por SIGLA (Princípio 18). Campo `data` duplica o id de propósito → permite `where('data','>=',X)` + `orderBy('data')` + `limit(20)` sem range em documentId.

**Gravação (client-side, idempotente):** em `inteligencia.html`, após `KPI.computar` do 1º acesso do dia: se `perfil ∈ {Admin, Editor}` → `getDoc(kpi_snapshots/HOJE)`; só se ausente → `setDoc`. Nunca update. Falha de gravação NÃO quebra o dashboard (try/catch com aviso discreto).

**Leitura da tendência:** `query(kpi_snapshots, where('data','>=', hoje−20d), orderBy('data'), limit(20))` → alimenta `_trend` (Δ7) e `_sparkPoints` (últimos 14).

**Bloco de rules (adicionar ao firestore.rules REAL, usando os helpers já existentes no arquivo — canWrite/ativo):**
```
match /kpi_snapshots/{dia} {
  allow read: if <helper de autenticado+ativo existente>;
  allow create: if <helper canWrite existente>;
  allow update, delete: if false;
}
```

**UI (inteligencia.html):** (a) cards do hero e dos 4 em foco ganham linha `Δ7d` (via `_deltaFmt`, tom via tokens --ok/--warn/--bad) + `<svg><polyline points=_sparkPoints stroke='currentColor'>` herdando a cor do card — ZERO hex; (b) nova seção "Score por setor": barra 0–100 + número + semáforo, "i" com os 3 componentes e pesos; (c) gargalos de `_gargalos` viram itens NOMEADOS no Plano de ação existente ("Gargalo: SEC — aderência 72% < 80%"); (d) sem 7 dias de histórico → badge "coletando (X/7 dias)" no lugar do Δ. Estados carregando/vazio/erro/sem-permissão preservados.

**Validação:** rodar `harness_n2.js` de novo após o merge (mesmos 27 casos) + `node --check` do script extraído do HTML.

---

## N3 — PERFORMANCE DE EQUIPE (de-mock performance.html + extensão kpi.js)

**Benchmark (web, 02/07):** ClickUp Workload (agrupar por responsável; capacidade em tons verde/amarelo/vermelho POR PESSOA; 1 unidade de esforço consistente — aqui: contagem de ocorrências; janela rolante 30–90d), Asana Workload (barra por pessoa; vermelho = sobrecarga; tarefa só conta com responsável+prazo), UpSys/ClickUp best practices ("sem responsável" como métrica de higiene; comparar planejado×feito na semana). **Veredito:** tabela-ranking por pessoa com semáforo + colunas de métricas, seção por setor reaproveitando o dado do N2, e "sem responsável" exibido como linha de higiene.

**Métricas por pessoa (`responsavelUid` → nome via coleção `usuarios`):**
| Métrica | Fórmula (vai no "i") |
|---|---|
| Aderência | feitas ÷ previstas até hoje ×100 (janela do período) |
| Conclusão no prazo | concluídas com dia local de `concluidaEm` ≤ `effDate` ÷ concluídas ×100 — comparação por data CIVIL local (Salvador UTC-3), declarada no "i" |
| Tempo de ciclo | média(`concluidaEm` − `iniciadaEm`) só quando AMBOS existem; sem par → "—" (nunca inventa) |
| Throughput | concluídas por semana (últimas 4) |
| Carga (WIP) | ocorrências abertas atribuídas hoje |
| Reprogramação | reprogramadas ÷ total ×100 |
| Score/semáforo | REUTILIZA `KPI._score(ader, %atras, aging)` da pessoa — mesmos pesos 50/30/20, declarados |

**Extensão do motor:** `KPI.computarPorPessoa(ctx)` REAPROVEITA o board já expandido por `computar`/`_buildBoard` (proibido duplicar a expansão de recorrência). Últimas ações: `query(atividade_log, where('uid','==',X), orderBy(<campo ts real do log>,'desc'), limit(10))` — conferir o nome do campo no atividade_log REAL antes de codar.

**UI (performance.html — reescrita total sobre a casca padrão de inteligencia.html):** banner fixo "Sem medição retroativa — mede a partir do atividade_log" · filtro Minhas equipes/Toda a escola? NÃO — padrão: Toda a escola com filtro por setor (siglas) · tabela ranking (nome, score+semáforo, aderência, no prazo, ciclo, carga, reprog) ordenada por score asc (pior primeiro = onde agir) · linha "(sem responsável)" destacada · seção por setor (dados do N2) · "i" em TODA métrica · estados completos.

---

## N4 — REUNIÕES → PLANO DE AÇÃO → PROJETOS (projetos.html novo + guard + atividades.html + rules)

**Benchmark (web, 02/07):** Fellow→Asana/ClickUp e Read AI→Asana (decisão/ação da reunião vira task rastreada em 1 clique, com dono, prazo e LINK DE VOLTA à nota de origem; itens incompletos ROLAM automaticamente para a pauta seguinte), Asana L10/EOS (pauta = métricas → issues → ações). **Veredito:** replicar os três mecanismos: origem rastreável, 1-clique com dono+prazo, rollforward de decisões abertas; pauta gerada dos indicadores segue o L10.

**Coleções (rules por coleção, RBAC canWrite, soft-delete `ativo`):**
- `projetos`: `{ nome, descricao, siglaSetores:[], donoUid, criadoEm, ativo }` — status DERIVADO (não gravado): `concluido` se %==100 · `atrasado` se ≥1 atividade vinculada atrasada · `em_dia` caso contrário. % do projeto = cascade (abaixo).
- `reunioes`: `{ data:'YYYY-MM-DD', titulo, projetoId|null, participantesUids:[], decisoes:[{ texto, donoUid, prazo:'YYYY-MM-DD', atividadeId|null, aberta:true }], criadoPorUid, criadoEm, ativo }` — decisão com `atividadeId` preenchido = já virou atividade.
- `subtarefas`: `{ atividadeId, texto, pct:0|25|50|75|100, ordem, ativo }`.
- `atividades` ganham campos OPCIONAIS `projetoId` e `origem:{tipo:'reuniao', reuniaoId}` (patch cirúrgico no modal do atividades.html real).

**Cascade:** ligar o `cascade.js` EXISTENTE (window.GrautCascade, validado na FASE 1): média das subtarefas → % da atividade; média das atividades vinculadas → % do projeto. Sem subtarefa → % da atividade = status (concluída=100, andamento=50? NÃO — regra simples declarada: concluída=100, demais=0, para não inventar progresso).

**Fluxos-chave:** (1) botão "→ Atividade" em cada decisão: cria atividade única com dono=donoUid, prazo, setor do projeto, `origem`, grava `atividadeId` na decisão e loga em `atividade_log`; (2) **"Gerar pauta da reunião de líderes"**: monta TEXTO copiável (textarea + botão copiar) com: atrasadas por setor (kpi.js) · gargalos nomeados (`_gargalos`) · decisões abertas de reuniões anteriores (rollforward Fellow) · aprovações pendentes; (3) visão do sócio: lista de projetos com barra de % + status derivado. Reuniões = aba interna de projetos.html (sem tocar ui.js). Rota `'Projetos': 'projetos.html'` no guard.js real.

**Gate do prompt original mantido:** N4 só entra se couber com folga depois de N2+N3; senão HANDOFF.

---

## RECUPERAÇÃO DOS ARQUIVOS (pré-requisito de QUALQUER build)
O Conhecimento atual está na era v7 (pré-Bloco 1). Os arquivos reais vivem no chat **"GRAU T - 5W2H + ATIVIDADES 08"** e no GitHub privado. Duas rotas:
- **Rota A (definitiva, 2 min):** tornar o repo público → GitHub → repo → Settings → General → Danger Zone → "Change repository visibility" → Public. A partir daí o Claude clona a PRODUÇÃO em qualquer chat (`git clone` já testado; falhou só por ser privado) e o loop de upload morre para sempre. Risco: código visível publicamente — sem segredos no repo (config Firebase é pública por natureza; segurança está nas rules), risco aceitável e foi a orientação do chat 08.
- **Rota B (manual):** abrir o chat 08 → baixar das caixas os 10 arquivos (`hoje.html` novo, `atividades.html`, `kpi.js`, `inteligencia.html`, `theme.css`, `guard.js`, `index.html`, `setores.html`, `firestore.rules`, `VARREDURA_ROADMAP_NOTURNO.md`) → arrastar ao Conhecimento do Projeto → conferir se o `hoje.html` novo subiu ao GitHub (teste: Meu Dia em produção SEM "Mariana").
