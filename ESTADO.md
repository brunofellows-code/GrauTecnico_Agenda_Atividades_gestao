# ESTADO — GERA · Sistema 5W2H + Agenda Diária · Grau Técnico FSA

> Fonte única da verdade sobre **onde o sistema está**. Atualizado em 16/09/2026, madrugada.
> O histórico completo de decisões (julho e agosto) está em
> `CONHECIMENTO/01_ESTADO_E_REGRAS/ESTADO.md`, no Drive do projeto — ver a nota no fim.

## 1. O que está no ar agora

| Item | Estado |
|---|---|
| Produção | GitHub `main@ef41177`, publicado pelo Netlify em https://agendagestaograutecnico.netlify.app |
| Item 1 (Atividades v3) | **publicado em 15/09 às 19h41** e conferido no ar: os 5 arquivos servidos batem com o commit, sha1 por sha1 |
| O que o Item 1 trouxe | quadro por etapa (A FAZER · FAZENDO · ATRASADAS · FEITAS), "Dar dono" em lote, conclusão com relato de 60+, diária de segunda a sexta respeitando os dias marcados, e o aplicador de arquivo de correção na tela de importação |
| Marco zero da medição | **16/09/2026**. Nada antes disso entra em contagem de falha ou atraso |

## 2. Dados — o que foi aplicado e o que espera

| Delta | Situação |
|---|---|
| `DELTA_DESATIVAR` (11/09, 20 ops) | pronto, **não aplicado** |
| `DELTA_MARCO_ZERO_v2` (189 ops) | pronto, **não aplicado** |
| `DELTA_DESATIVAR_TESTES` (2 ops) | pronto, **não aplicado** |
| `DELTA_DONO_SANEAMENTO.csv` (114 linhas) | pronto, **não aplicado** — revisar antes as 22 linhas de "Tiago Reis": as de gestão operacional podem ser do Bruno Bandeira |
| `DELTA_FUSAO` (7 ops) e `DELTA_PESO_v3` | prontos, **só depois de 22/09** (decisão do Bruno) |

Ordem de aplicação combinada: DESATIVAR → MARCO_ZERO v2 → DESATIVAR_TESTES → equipes → DONO.

## 3. Pessoas (fato fechado)

| Pessoa | Papel real | Perfil no banco |
|---|---|---|
| Bruno Fellows | sócio | Admin (o `guard.js` trata Admin como gestor) |
| Tiago Reis | sócio | gestor |
| Bruno Bandeira | gestor operacional do setor GES — **pessoa diferente de Bruno Fellows** | gestor |
| Antonia · Brenda · Kamile · Thais Araujo · Juliana | líderes de SEC · PED · CRA · COM · CSA | lider |

Quem responde pelo SOC: quem tem `socio: true`. Pelo GES: gestor sem `socio: true`.
**Pendência de dado:** `socio: true` ainda não está marcado em Bruno Fellows nem em Tiago Reis — sem isso, ninguém responde pelo SOC na tela.

## 4. Decisões de 15/09 que continuam valendo

Marco zero 16/09 · diária de segunda a sexta · A FAZER com 1 cartão por atividade, sem limite de período · FEITAS de 7 dias · quadro do setor inteiro, com "Só as minhas" desligado · relato de 60+ para concluir · Top 3 mais quem vê (nunca os 3 últimos) · gargalos só para gestor e líder · Plano de Resgate dá bônus, nunca ponto negativo · verde da marca ≠ verde de sucesso · horas de esforço ocultas · "Do catálogo" como botão principal · Google Agenda não ativar.

## 5. Trabalho da noite de 15→16/09 (branches para revisar e juntar)

| Branch | O que traz | Portões |
|---|---|---|
| `noite/regras` | a `firestore.rules` do repositório passa a ser a **publicada** (413 linhas, com R10). As regras novas ficaram como proposta escrita, não aplicadas | parcial |
| `noite/reunioes` | motor da série (seções e tempo, rolagem, ata, nota), convite em 1 olhada, selo "Sem ata", Próximas \| Passadas, ata em 1 clique e a próxima reunião nascendo ao fechar | ✅ 8/8 · 64 testes |
| `noite/planejamento` | motor da janela 25–28, semana ISO, validações do item e do acompanhamento, célula da grade e resgate; a faixa da janela já aparece na tela | ✅ 8/8 · 67 testes |
| `noite/hoje` | **concluir passa a exigir relato de 60+** (antes gravava sem relato nenhum) | ✅ · correção crítica |
| `noite/atividades` | motor do Pareto de falhas com marco zero, corte em 80%, e o item pronto para levar à pauta de terça | ✅ 8/8 · 43 testes |
| `noite/glossario` | critério das siglas do manual (NC, LFR, MT, LFI, LAC), TMA, e os termos novos da noite | ✅ |
| `noite/agenda` · `noite/usuarios` | em execução paralela na mesma noite | ver handoff |

**Ordem de publicação (mudou de propósito):** telas primeiro, **regras depois**. A regra nova exige relato ao concluir; publicada antes da tela Hoje corrigida, derrubaria toda conclusão em produção.

## 6. Pendências herdadas (não perder)

Formulário de atividade de 12 para 4 campos (item 19) · duplicação dos 67 riscos entre `riscos.html` e `planejamento.html` · glossário ainda sem o significado das LETRAS das siglas (o critério já está escrito; as letras dependem da CRA) · teste de clique em produção (só o Bruno faz).

## 7. Pedido do Bruno em 16/09, madrugada

> "Me entrega layout e design é excelente experiência de usuário! Lembrar de gatilhos mentais e envio de mensagens incentivadoras."

Registrado como diretriz permanente do produto, ao lado de "acessibilidade nunca relaxa".

**Como está sendo lido (e o que ficou de fora, de propósito):** gatilho mental aqui é o que a
literatura de comportamento chama de *feedback loop* honesto — a pessoa vê o efeito do que
acabou de fazer, vê o quanto falta, e é chamada pelo nome. Entram: progresso visível,
fechamento de ciclo ("acabou, pode fechar"), sequência real (dias seguidos com tudo entregue),
prova social verdadeira (quem mais do setor já entregou), e a mensagem que reconhece o esforço
no momento em que ele acontece.

**Não entram, e o motivo:** urgência falsa ("faltam 3 minutos!"), escassez inventada, contagem
regressiva que não corresponde a prazo real, culpa ("você decepcionou o setor") e ranking dos
piores. Três razões: (1) o sistema já decidiu em 15/09 que o Top 3 nunca mostra os três últimos;
(2) métrica que vira alvo deixa de ser métrica — aqui isso apareceria como gente concluindo sem
fazer só para manter a sequência; (3) quem lidera lê o relato, e um relato escrito sob pressão
artificial não serve para decidir nada. Incentivo que mente uma vez nunca mais é lido.

---

### Nota sobre o histórico
O histórico completo (julho e agosto, 85 KB) **não foi copiado para cá de propósito**: este repositório é publicado inteiro pelo Netlify, e qualquer `.md` aqui fica acessível na internet — conferido em 16/09 com resposta HTTP 200 para `LEIA-ME.md`, `ARCH_EVENTOS_CALENDARIO.md` e `HANDOFF_SESSAO_CONCLUSAO.md`. Enquanto isso não for resolvido (ver `NOITE/HIGIENE_REPO.md`), o histórico fica no Drive, e aqui mora só o estado corrente.

## 8. Fechamento da madrugada de 16/09 (conferido de manhã)

**No ar:** continua `main@ef41177`. Nada foi publicado, nada foi gravado no Firestore.
**Pronto para revisar:** branch `noite/integracao`, 29 commits à frente do `main`, com as 10 branches `noite/*` juntadas sem conflito.

**Provado numa cópia navegável do sistema (guard.js real, só o Firebase dublê):** 56 páginas (4 perfis × 14 telas) sem erro de JavaScript · 1.765 cliques sem erro · ~300 botões testados, 0 órfão · 516 casos de teste passando · 7 números da tela conferidos à mão contra o banco.

**9 defeitos corrigidos** — os dois mais graves: a tela Hoje inteira caía com atividade "todos os setores"; e o líder sem tarefa própria perdia todos os cartões de liderança. Os outros: cabeçalho e chips de Reuniões com número errado, "Comece por esta" ignorando horário, linha do tempo fora de ordem, "Sem responsável 0" falso em Atividades, aba do sócio que nunca aparecia, botão morto em Setores, aviso tardio em Importar.

**Entregue do pedido de layout/incentivo:** cartão "Entregue hoje no seu escopo" para líder e gestor (com o último relato de cada pessoa) + carimbo "lido às HH:MM" com botão Atualizar no Hoje.

**Pendente (não perder):**
1. **Publicar** — telas primeiro, Regras depois, minutos de intervalo (a regra do relato derruba conclusão se for antes).
2. **38 suspeitas da auditoria não verificadas.** A mais séria: as Regras do Firestore deixam o líder escrever em setor que não é dele. Depois: Reuniões sem recorte de setor; foto do dia da Inteligência gravada com o recorte de quem abriu primeiro; Cockpit dizendo "salvo" quando falhou; ata listando presente como ausente; Atividades bloqueando o usuário de concluir a própria tarefa.
3. **Dado congela** em todas as telas (nenhuma assina o banco). Só o Hoje ganhou o carimbo de hora. Assinar ao vivo é decisão de arquitetura.
4. **Regra R11 (relato obrigatório no banco)** ainda não aplicada — proposta em `NOITE/regras_R11_PROPOSTA.md`.
5. **3 testes antigos falham** (`harness_f1e`, `f1l`, `n2`) — já falhavam no `main` publicado, não são da noite.
6. Correções da madrugada estão só na `noite/integracao`, não nas branches de módulo.
7. Herdadas: formulário de atividade de 12→4 campos · letras das siglas (depende da CRA) · repositório público via Netlify · `socio: true` no banco para Fellows e Tiago · verde da marca com tinta escura.

Relatório completo: `NOITE/RELATORIO_MANHA.md` · versão para celular: https://claude.ai/artifact/Xntt2gwTsFqijA6NGKmpgz

## 9. Decisões do Bruno em 16/09, manhã (permissões, atividades, próximo mês)

**a) Quem grava o quê**
- **Líder** grava só no próprio setor, inclusive para as pessoas que estão dentro do setor dele.
- **Líder não grava em outro setor.** Quando precisa de algo de outro setor, **solicita ao líder de lá, que tem de aceitar**.
- **Gestor e sócio** gravam e criam atividade quando quiserem, para quem quiserem, com a periodicidade que quiserem.

**b) Quem vê o quê**
- Líder **não vê** o planejamento dos outros setores — só as tarefas/atividades que têm interseção com o setor dele.
- Líder vê a **Inteligência só do próprio setor** (e dos seus colaboradores, se essa visão existir; se não existe, não criar agora).

**c) Arquitetura** (consulta pela data original × data reprogramada; dado que congela na tela) — **decisão delegada ao Claude.**

**d) Atividade ativa × inativa**
- Reunião de sócios: fica cadastrada como atividade **inativa, com possibilidade de ativar**.
- Atividades fora do Pareto: ficam no banco **como inativas**, não são apagadas.
- **Líder, gestor e sócio conseguem ativar** uma atividade inativa quando sentirem necessidade.
- **Líder, gestor e sócio conseguem criar atividade** — demanda específica tem de poder entrar na agenda.

**e) Próximo mês**
- Não mostrar nota/desempenho de mês que ainda não começou.
- Mas todo perfil precisa ter **uma forma de consultar a própria agenda de atividades e compromissos do mês seguinte**, se quiser.

## 10. Respostas do Bruno em 16/09, tarde

- **Sistema nunca foi usado em produção** — não há histórico real a proteger.
- **Pareto:** todas as atividades da planilha `ARQUIVOS PARETTO/2026-09-15_PARETO_ATIVIDADES_v3.xlsx` (187) ficam **cadastradas na aba Atividades com a classificação** (vital · importante · rotina) e com o **responsável que a planilha indica**. Atividade que existir no banco e **não estiver na planilha** fica **inativa** (ativável). *Leitura do Claude: "fora do Pareto" = fora da planilha, não "rotina".*
- **1) Firebase:** plano **gratuito (Spark, 50 mil leituras/dia)**. Passa para o pago só se for necessário. → Projetar leitura para caber no gratuito.
- **2)** Todas cadastradas com classificação e responsáveis da planilha (ver acima).
- **3) Atividade em vários setores:** cada setor envolvido conclui; concluída conta nos 3. *Se o modelo ficar confuso, deixar escrito e decidir depois — não parar.*
- **4)** Decisão na Reunião de Líderes para outro setor, com o líder presente → vira atividade direto (presença = aceite). **OK.**
- **5)** "Líder não vê outros setores" = a tela esconde; o banco não precisa recusar leitura. **OK.**
- **6)** Pedido de mudança de data de tarefa do setor: decide o **líder do setor**. **OK.**
- **7)** Reativar não conta o período inativo como falha. **Importante: dar para deixar a atividade ativa e desativada com facilidade.**
- **8) Reunião de sócios:** **1 vez por semana, sócios + líderes** (cadastrada inativa, ativável).
- **9)** "Minha agenda" do mês seguinte = atividades em que é responsável + reuniões/eventos em que foi convidado. **OK.**
- **10)** Ocorrências do mês seguinte saem da nota do mês atual; nota do Planejamento conta só itens vencidos. **OK.**
- **Design (importante):** a **marca é VERDE, não azul** — a decisão de 15/09 (`#34E27E` escuro / `#16A34A` claro, ≠ verde de sucesso) prevalece sobre a migração para azul de 02/09 (theme.css). Tudo novo usa **as mesmas cores das abas existentes** e tem **tema claro E escuro**, sempre.

## 11. Resultado de 16/09, tarde — correções juntadas na `noite/integracao`

**Feito e provado** (nada publicado; `main` segue `ef41177`):
- **29 defeitos confirmados + 5 correlatos corrigidos** em 8 grupos (cockpit, reuniões, inteligência, performance, atividades, hoje, motor, diversos), cada um revisado por agente independente — 8/8 aprovados (motor após 1 reparo). Destaques: nome de pessoa montado em HTML na Performance (segurança); "salvo" falso e histórico errado no Cockpit; foto do dia da Inteligência gravada com recorte do líder; ata listando presente como ausente; "Concluir" ao vivo sem relato; Planejamento com "Nota 0" em mês futuro; reunião "sem hora" na Agenda.
- **Marca verde** nos dois temas, com tinta escura (contraste 11:1 escuro / 5–7:1 claro); 0 usos da marca como cor de texto.
- **Portão preso em rede lenta** (reproduzido com servidor atrasando script do `<head>`) — corrigido.
- **Tema claro/escuro no cartão do usuário em toda tela**; papel real no cartão (Líder, não "Editor").
- Regressão: **56 páginas sem erro · 1.104 casos passando** · raiz só com as 3 falhas antigas (f1e, f1l, n2).

**Depende do Bruno**
1. Nomes (e login) das 9 pessoas por trás dos cargos que são donos de 41 atividades da planilha (Assis. PED 1/2, Assis. SEC Adm 1/2, Assis. CRA 1/2, Assis. SEC Financeiro, Assis. SEC DP, Vendedor 1). Proposta: líder do setor como dono provisório.
2. Dia e hora da reunião semanal sócios + líderes (padrão proposto: quinta 16h, inativa).
3. No tema claro a marca (#16A34A) é igual ao verde de sucesso — mexer no semáforo ou não.
4. Encerrar processos que ficaram soltos (hook bloqueia o Claude): Chrome headless dos testes e servidores de teste nas portas 8931 e 8777.
5. Publicar: telas primeiro, Regras R12 depois (fora do horário).

**Próximas entregas do Claude, nesta ordem**
1. Cadastro do Pareto: peso (vital/importante/rotina) e dono da planilha nas 187; inativar o que está no banco e não está na planilha; selo + filtro de classificação em Atividades; botão "Inativas" acessível; reativar sem atraso falso; importação e catálogo enxergando inativas (sem duplicar).
2. Permissões do líder (R12 + telas): grava só no próprio setor; atividade de vários setores — qualquer líder listado conclui e vale para todos; decisão na Reunião de Líderes com o líder presente vira atividade; pedido de data decidido pelo líder do setor; pedido entre setores com aceite; aceite de parceiro no Planejamento; Importar só gestor; recorte por posse em Inteligência/Performance/Planejamento.
3. Leitura dentro do plano gratuito: parar de reler o banco inteiro a cada ação; medir leituras no simulador.
4. Tarefa adiada para longe que some do Hoje (consulta também por data reprogramada).
5. Decisão 10: nota do Planejamento só com itens vencidos; ocorrências do mês seguinte fora da nota do mês.
6. "Minha agenda" do mês seguinte (3º botão na Agenda).
7. Carimbo "lido às" nas outras 5 telas.
8. Acessibilidade que já reprovava antes (não piorou, mas a regra é nunca relaxar): `--muted2` como texto no escuro (3,69:1); semáforo como texto no claro (3,19–3,30:1); linha inativa em Usuários (3,28:1); cartão de pessoa da Performance sem Enter/Espaço; Usuários quebrando em 375px; toast do Cockpit (4,26:1 no claro).
9. Resíduos menores dos revisores: foco de teclado perdido ao navegar períodos no Cockpit; reunião de data passada não pode ser iniciada; drill da Inteligência indicando status só por cor; aviso "Atualizar no topo" some em telas ≤900px; "Ativar" em Usuários com cadastro sem perfil dá erro técnico; lista de Usuários esconde cadastro sem nome; concluir em Atividades não limpa a trava; nome truncado no cartão com o botão de tema.

## 12. Contas de login (fato, 16/09) — backup 11/09 × Bruno

São **10 contas** no Firebase Authentication. Os 9 cargos da planilha do Pareto (Assis. PED 1/2, Assis. SEC Adm 1/2, Assis. CRA 1/2, Assis. SEC Financeiro, Assis. SEC DP, Vendedor 1) **não têm login**: as atividades deles ficam com a conta do setor.

> **E-mails e UIDs NÃO ficam aqui.** O repositório no GitHub e o site no Netlify são **públicos**; a tabela completa está no Drive, em `2026-09-15/ARQUIVOS PARETTO/2026-09-16_CONTAS_DE_LOGIN_PRIVADO.md`.

| Pessoa | Papel no banco (backup 11/09) | Bruno, 16/09 |
|---|---|---|
| Bruno Fellows | Admin | **sócio** (falta `socio:true`) |
| Tiago Reis | gestor · GES | **sócio** (falta `socio:true`) |
| Bruno Bandeira | gestor | gestor |
| Antonia | líder SEC | Antonia |
| Thais Araujo | líder COM | Thais |
| Kamile | líder CRA | Kamile (CRA) |
| Brenda | líder PED, QLD, AGE | Brenda |
| Juliana | líder CSA, PVE | pós-venda |
| conta da Agência | **Mariana** · líder AGE · setor CSA | **Beatriz** — "responsável CSA" |
| conta de teste | usuário teste | teste (desativar, não apagar) |

**Divergências a confirmar:** (1) conta da Agência: o nome no banco é Mariana, o Bruno diz Beatriz; e ela lidera só a Agência (AGE) ou o CSA inteiro? (2) AGE aparece liderado por duas contas no backup (Brenda e a da Agência).


## 13. Cadastro do Pareto — arquivos de correção prontos (16/09)

Pasta `2026-09-15/ARQUIVOS PARETTO/`. Aplicar na tela **Importar → Aplicar arquivo de correção** (só gestor), **nesta ordem**:

| # | Arquivo | Operações | O que faz |
|---|---|---|---|
| 1 | `ARQUIVOS ATIVIDADES /02_FIRESTORE/2026-09-11_DELTA_DESATIVAR.json` | 20 | desativa |
| 2 | `ARQUIVOS ATIVIDADES /02_FIRESTORE/2026-09-15_DELTA_MARCO_ZERO_v2.json` | 189 | início 16/09, dias da semana |
| 3 | `ARQUIVOS PARETTO/2026-09-15_DELTA_DESATIVAR_TESTES.json` | 2 | desativa testes |
| 4 | `ARQUIVOS PARETTO/2026-09-16_DELTA_DONO_v4.json` **(novo)** | 111 | responsável das 187 (76 já certas); 41 com o líder do setor como dono **provisório** (cargo sem login) |
| 5 | `ARQUIVOS PARETTO/2026-09-15_DELTA_PESO_v3.json` | 187 | classificação vital · importante · rotina |
| 6 | `ARQUIVOS PARETTO/2026-09-16_DELTA_INATIVAR_FORA_PLANILHA.json` **(novo)** | 7 | inativa (não apaga) o que está ativo e fora da planilha — parecem as 7 fusões; o `DELTA_FUSAO` citado no handoff não está no Drive |

**Provado:** as funções REAIS do aplicador (extraídas do `importacao.html`) rodaram os 6 arquivos em sequência sobre o backup de 11/09 → **0 bloqueadas**; estado final **187 ativas · 0 sem dono · 0 sem classificação · 46/80/61**; reaplicar dá "já aplicada" (idempotente). Ressalva: o banco real pode ter mudado desde 11/09; se mudou, o aplicador bloqueia a operação em vez de gravar errado.

`DELTA_DONO_SANEAMENTO.csv` (11/09) fica **obsoleto** — o DONO_v4 o substitui.

**Na tela Usuários (gestor), à mão:** marcar **sócio** em Bruno Fellows e Tiago Reis; corrigir o nome da conta da Agência (Mariana → Beatriz) depois de confirmar o escopo dela (§12).

**Ainda falta no código** (próxima entrega): classificação visível e filtrável em Atividades; botão "Inativas" acessível; reativar sem atraso falso; importação/catálogo enxergando inativas (sem duplicar).

## 14. Pareto na tela — entregue na `noite/integracao` (16/09, tarde)

Commit `6e6bcda` (branch `fix16/pareto`), juntado em `f9f8fa5`. Revisado por mim antes de juntar (escopo, motor, capturas, processos).
- **Classificação visível** em Atividades: selo VITAL em destaque, IMPORTANTE e ROTINA discretos, sempre com texto (nunca só cor); atividade sem `peso` fica sem selo.
- **Filtro** Todas · Vital · Importante · Rotina (+ "Sem classificação" quando existe), cada chip com a contagem que aparece se clicar.
- **Campo "Classificação (Pareto)"** no formulário da atividade.
- **Botão "Inativas (N)" sempre na barra** (escopo de quem vê), com motivo (fora do Pareto / inativada à mão / sem motivo), desde quando, por quem, busca e "Ativar".
- **Ativar sem atraso falso** (`R.inicioAoReativar` em recorrencia.js): a série volta a contar a partir do dia da ativação; bimestral/trimestral mantém o ciclo; única com data passada pede data nova. Inativar grava motivo, data e quem.
- **Sem duplicata:** a importação recusa código que existe como inativa ("ative em Atividades → Inativas"); "Criar do zero" e catálogo oferecem "Ativar esta".
- Provas: harness novo **99/99** (83 dos 97 casos falham no código antigo); 36 pares de contraste ≥ 4,5:1 nos dois temas; todos os harnesses **1.203 casos passando**, raiz só com as 3 falhas antigas; **56 páginas sem erro**.
- Corrigido junto: o botão flutuante "Tema" ainda aparecia no computador (a regra do `components.css` perdia para o CSS da tela) — agora some de verdade (commit `862aff7`).

**Decisões em aberto (do Bruno):**
1. **Brecha do "ativar sem atraso":** inativar e ativar no mesmo dia zera atrasos antigos daquela atividade (fica registrado quem e quando, mas a brecha existe). Alternativa mais cara: o motor guardar os períodos parados e pular só esses dias.
2. **Não reaplicar arquivo de correção antigo** depois de reativar uma atividade à mão: o `DELTA_INATIVAR_FORA_PLANILHA` a inativaria de novo (o aplicador compara com o backup).
3. Dia e hora da reunião semanal sócios + líderes (§11) e escopo da conta da Agência (§12) — continuam pendentes.

**Acessibilidade que já reprovava (somar à lista do §11):** etiqueta "Atrasada" em Atividades (3,6–3,8:1); texto vermelho de atraso no claro (4,26:1); modal do ui.js sem `aria-labelledby`.

## 15. Permissões do líder (R12) — em execução (16/09, tarde)

Bruno: "segue! e conclui". Sem resposta às 3 perguntas de §14, apliquei os **padrões propostos** (mudam se o Bruno disser outra coisa):
1. Brecha "inativar e ativar no mesmo dia zera atraso antigo": **fica como está**, registrada (quem e quando).
2. Reunião semanal sócios + líderes: **quinta, 16h**, cadastrada inativa.
3. Conta da Agência: **continua liderando só a Agência (AGE)** como no banco; nome Mariana → Beatriz é ajuste manual na tela Usuários.

**Base comum:** regra única no `kpi.js` (commit `642a7b3`, 42 casos): `meuSetor`, `possuiAtividade`/`podeEditarAtividade`, `podeExecutarOcorrencia` (decisão 3), `vitrineNoEscopo`, `pessoaNoEscopo`, `lideresDoSetor`. **Contrato** dos documentos (pedido entre setores, aceite de parceiro, reunião por tipo, etc.) escrito para os 7 executores.

**Em paralelo, um executor por grupo:** Atividades · Hoje (com "Pedidos para o seu setor" e "Seus pedidos") · Reuniões · Planejamento · Inteligência + Performance · Importar + Agenda · Regras do Firestore (R12). Cada entrega é revisada antes de juntar.

**Interrompido (16/09, tarde):** os 7 executores pararam no meio por **limite semanal de uso da conta** (renova às 20h, horário da Bahia). Nada foi juntado — `noite/integracao` segue consistente (só a regra única no kpi.js + ESTADO). Trabalho parcial **preservado, sem commit**, nas worktrees:
`~/GERA_wt_r12_atividades` (atividades.html + harness) · `~/GERA_wt_r12_hoje` (hoje.html + harness) · `~/GERA_wt_r12_reunioes` (projetos.html, reunioes-motor.js + harness) · `~/GERA_wt_r12_planejamento` (planejamento.html + harness) · `~/GERA_wt_r12_intel` (inteligencia.html, performance.html + harness) · `~/GERA_wt_r12_import` (importacao.html, eventos.html, agenda-motor.js + harness) · `~/GERA_wt_r12_regras` (vazia; rascunho em scratchpad). Nenhum processo solto.
**Para retomar:** cada executor continua de onde parou (rodar harness e portões, capturas nos 2 temas, commit), depois revisão, junção e regressão completa. Não apagar as worktrees até lá.
