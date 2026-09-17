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

## 16. PUBLICADO — 16/09, noite

**No ar:** `main@61d6bd0` (commit único "Publica o trabalho de 15-16/09"), publicado pelo Bruno; conferido pelo Claude: **36 de 36 arquivos servidos pelo Netlify batem, byte a byte, com o commit.** `ESTADO.md` no ar sem e-mail nem UID.

- Publicado como **um commit só**, a partir de `ef41177`, com a árvore idêntica à `noite/integracao` testada (56 páginas sem erro, 1.245 casos). Motivo: o histórico da `noite/integracao` tem um commit com e-mails e UIDs das contas, e o GitHub e o site são **públicos**. **Nunca enviar `noite/integracao`, `fix16/*` nem `r12/*` ao GitHub.**
- **Não está no ar:** permissões do líder por setor (R12, interrompido por limite de uso — ver §15) e as Regras novas do Firestore.
- **Próximos passos do Bruno, nesta ordem:** (1) abrir o sistema e fazer o teste de 3 minutos do Hoje (quem tiver a tela aberta precisa recarregar); (2) tela Importar → aplicar os arquivos de correção na ordem do §13; (3) tela Usuários → marcar sócio em Bruno Fellows e Tiago Reis.

## 17. Avaliação do Bruno depois da publicação (16/09, noite) — REPROVADO

Bruno viu o sistema no ar e reprovou: "me entregasse a mesma merda que tínhamos"; cadê a tela Hoje com gráficos; cadê o modelo de mercado da pauta de reunião (atraso, tempo); tela de Reuniões e de Planejamento péssimas; bagunça visual; que referências de mercado e que skill de design foram usadas.

**Causa (do Claude, sem desculpa):** trabalhei a partir do código e do prompt da madrugada e **não li o que define as melhorias**: `CONHECIMENTO_GERA_2026-09-16/02_PRODUTO_E_DESIGN/` — `LIVRO_DO_PRODUTO_v1.md`, **`MOCK_HOJE.html` e `MOCK_ATIVIDADES.html` (referência visual literal do redesign aprovado; o do Hoje tem gráficos)**, `REVISAO_MELHORIAS_UX.md`, `AUDITORIA_UX_REPO.md` — nem `01_ESTADO_E_REGRAS/2026-09-15_HANDOFF_PRODUCAO.md`, `2026-09-16_PROMPT_PROXIMA_SESSAO.md` e `04_MANUAIS_SETORES/00-CHECKLIST-REUNIAO-INTEGRADA.md`. Os motores de reunião e planejamento "padrão de mercado" foram escritos mas as telas não os usam (planejamento.html nem carrega o motor). Nenhuma skill de design do Bruno (`bruno-design`, `bruno-dashboard-kpi`) foi usada nas telas.

**Decisão do Claude:** parados os 6 executores de tela da R12 (trabalho salvo nas worktrees) para não gastar crédito em telas que vão mudar; só o executor das Regras segue (não mexe em tela).

## 18. Diagnóstico pós-reprovação (16/09, noite) — números e plano de virada

**Por que "tanta tarefa atrasada"** (motor real sobre o banco de 11/09): **2.513 atrasadas** no banco como está (uma atividade acumula 32×); **129/216 sem dono**; com marco zero aplicado, 295 no dia 1 e **+63 por dia útil** sem uso (63 rotinas diárias) → 1.982 em um mês. Causa de desenho: **cada dia perdido de rotina diária vira um cartão de atraso separado, para sempre**. Correção proposta: uma pendência por rotina (dias perdidos = "não feita", contam na aderência) + atrasadas em faixas de idade (Upflow aging balance; Todoist/Asana só a próxima ocorrência).

**Poluição medida** (simulador, 1440×900): Atividades **54 controles acima da dobra**, conteúdo em y=598; Hoje 58–66% da 1ª tela vazia, vão de 138 px; Reuniões **71% vazia**; Planejamento 27 controles + 3 faixas; Inteligência 101 números sem herói.

**Aprovado × no ar:** Hoje sem bullet/sparkline e com filtros acima da dobra; Atividades com pílula vermelha por linha (rejeitada em 15/09); Reuniões = formulário com textarea vazia (motor de blocos/tempo existe e a tela não usa); Planejamento = relatório de cobertura, subsetor como plano, **planejamento-motor.js nem é carregado**.

**Planilhas do Bruno lidas** (Drive): ATA REUNIÃO INTEGRADA (aba Resumo de demandas: Ação·Setor·Quem·Início·Prevista·Conclusão·Dias·% planejado·Status; 1ª/2ª avaliação) e PLANEJAMENTO MENSAL — MODELO (grade semanal + 5W2H: O quê·Onde·Como·Quem·Quando·Quanto·Prazo·Status). Viram a tabela de demandas da reunião e a grade 5W2H do plano.

**Mercado consultado:** Pipedrive Insights (1 gráfico = 1 pergunta, meta na coluna, clique abre lista, previsto×realizado), Upflow (1 número de risco, aging em faixas, "To do"), EOS L10 (blocos com relógio, nota 1–10), Fellow (rolagem), Linear (3 números + 1 ação), Todoist (próxima ocorrência).

**Plano de virada (ordem):** 1) aplicar os 6 arquivos na Importar + sócio; 2) regra "uma pendência por rotina" + faixas; 3) Hoje conforme mock aprovado (bullet, sparkline, barras por setor, EXIGE VOCÊ); 4) Reunião ao vivo (blocos com tempo, item 1 = demandas da ATA, item 2 = previsto×realizado, ata gerada, nota); 5) Planejamento = um plano por setor, grade 5W2H inline, mês×setor; 6) Atividades Opção B; Inteligência/Performance em cartões. Portão por tela: mock nos 2 temas aprovado pelo Bruno, ≤8 controles acima da dobra, ≤40% vazio, "i" + clique em todo número, caminhada dos 4 perfis sem erro.

**Decisões pendentes do Bruno:** (a) rotina não feita empilha ou vira "não feita"? (b) blocos e tempos da Reunião de Líderes (proposta: os 6 do checklist integrado, 10 min cada).

**Lição registrada:** antes de tocar tela do GERA, ler `CONHECIMENTO_GERA/02_PRODUTO_E_DESIGN` (livro, mocks aprovados, auditoria UX) e o HANDOFF; o desenho aprovado prevalece sobre o código; usar bruno-design + assessores como portão.
Relatório para o celular: artefato "Virada do GERA".

## 19. Decisão 16/09 (noite): só as 46 VITAIS ativas + UM arquivo de correção

**Bruno:** "Fechamos que usaríamos Pareto + vitais e as demais ficariam desativadas no banco de atividades. O líder poderia ativar e atribuir a alguém e poderia inclusive criar uma nova." Os 6 arquivos de §13 deixavam as 187 ativas — faltava este passo.

**Arquivo único:** `ARQUIVOS PARETTO/2026-09-16_DELTA_CONSOLIDADO_v1.json` (218 operações, uma por atividade) = os 6 arquivos de §13 na ordem certa **+ inativar as 141 importantes/rotina** (`motivoInativa: pareto_nao_vital`, ativáveis em Atividades → Inativas, com `inicioAoReativar` = sem atraso falso). **Provado com o aplicador real** sobre o backup 11/09: 218 prontas · 0 bloqueadas · estado final **46 vitais ativas, 0 sem dono, 187 classificadas** · idêntico campo a campo à aplicação sequencial · reaplicar = 218 "já aplicadas". Substitui a aplicação em 6 passos (os 6 continuam válidos, mas não precisam mais ser aplicados um a um). Script: scratchpad `gerar_delta_consolidado.js`.

**Atraso medido de novo com o motor real, janela do ano inteiro, ninguém usando** (`medir_atraso_cenarios.js`; corrige o "295" do §18, que foi medido só com o marco zero):

| Cenário | ativas | 16/09 | +1 semana | +1 mês |
|---|---|---|---|---|
| A · banco como está | 218 (129 sem dono) | **3.098 cartões** / 213 atividades (máx 47×) | 3.469 | 4.771 |
| B · 6 arquivos aplicados | 187 | **9** / 9 | 337 / 125 | 1.476 / 183 |
| C · consolidado (só vitais) | 46 (23 diárias) | **2** / 2 | 132 / 40 | 575 / 46 |

"cartões" = tela de hoje (1 por dia perdido); "atividades" = regra de mercado (Todoist/Asana: 1 pendência por rotina, dias perdidos viram histórico). **Com a regra de mercado o teto de atrasadas é o número de atividades ativas (46)**; sem ela, 575 em um mês mesmo só com as vitais. Decisão tomada por benchmark (Bruno: "não me pergunte"): implementar a regra.

**Fontes tipográficas:** família única (Sora via `@import` no theme.css, presente em todas as telas) — o que difere é a **escala**: cada tela declara a própria (hoje 47, atividades 84, inteligência 54 `font-size` distintos). Correção: escala única no theme.css e telas sem `font-size` próprio.

## 20. Hoje v2 construído (16/09, noite) — branch `tela/hoje-v2`, worktree `~/GERA_wt_hoje2`, commit ea5a2db

**O que é:** `hoje.html` reescrito na estrutura do mock aprovado em 15/09 (`02_PRODUTO_E_DESIGN/2026-09-15_MOCK_HOJE.html`), com dado real do motor e a camada de ações herdada da tela anterior (concluir com relato 60+, travar com motivo, adiar/pedido, RSVP Vou/Não vou, aceite de atribuição, fechar ata). Blocos por perfil:
- **Gestor:** Exige você (convocações sem resposta · reuniões sem ata · atividades sem dono · planos escalando) → progresso do dia → carimbo "lido às" → Painel do dia · unidade (No ritmo = bullet chart com meta 90% + tendência dos snapshots · Atrasadas · Esperam dono · Reuniões a responder) → Pendências por setor (barras, clique abre Atividades filtrada via `gera_setor_ctx`) → Pendência de cada setor (cartões) → Comece por esta → Agenda de hoje → Mais atrasadas da unidade → Reuniões → Ranking Top 3 + você.
- **Líder:** Exige você → progresso → Seu setor em números → Sua equipe (cartão por pessoa; vazio didático) → Comece por esta → Agenda → Mais atrasadas do setor → Reuniões → Ranking.
- **Usuário:** progresso → Seu dia em números (3) → Comece por esta → Agenda → Suas atrasadas → Reuniões.
**Regras:** zero filtro acima da dobra (lentes, Minhas/Todas, camadas e seletor de setor saíram); "i" em todo número (fórmula · dados · números · para que serve) e clique que leva à lista; tokens do theme.css (marca verde), claro e escuro; escala tipográfica só do theme.css; ES5.
**Motor:** `KPI.pendenciasPorRotina(board, hoje)` e `KPI.faixasDePendencia(itens)` em kpi.js (bloco R12), harness `NOITE/harness_pendencias.js` 17/17. A regra é de LEITURA: nada é gravado; as ocorrências antigas seguem no board e na aderência.
**Deixou de carregar no Hoje:** lentes.js, ctx.js (o contexto de setor continua sendo lido por Atividades), psicologicos.js, quick-add.js/anti-dup.js/undo-toast.js (Ctrl+N — criação fica em Atividades), hoje-cockpit-l3.js/css, fluxos-l3.css. Se algum for necessário, é decisão consciente, não perda.
**Medido no simulador (banco no estado-alvo: 46 vitais + 2 únicas, uma semana de uso; 1440×900):** conteúdo começa em 98 px (antes 108–598); maior vão 24 px (antes 122–138); filtros acima da dobra 0 (antes 16); 0 erros de console nos 3 perfis × 2 temas. O "% da 1ª tela sem texto" pelo método antigo fica ~57% (gestor) porque conta o respiro interno dos cartões — métrica ruim para comparar; a que importa é o vão.
**Simulador:** `_sim_fonte/dados.js` agora é GERADO (`gerar_dados_sim.js`: backup + consolidado + semana simulada, contas u_*, 7 snapshots); `?tema=dark|light` na URL fixa o tema para captura. Capturas em `scratchpad/shots/hoje2_*.png`.
**Pendente para publicar:** aprovação do Bruno pelas capturas; merge de `tela/hoje-v2` em `publicar/2026-09-16` (limpo) e push por ele. Depois: Reuniões → Planejamento → Atividades → Inteligência/Performance na mesma disciplina.

### 20.1 Refinamentos depois do primeiro teste de uso (16/09, 21:50–22:00)
- **Regra "uma pendência por rotina" fechou o passado** (Todoist): perdidas ANTERIORES à última conclusão da rotina viram histórico (`historico` no retorno), não pendência. Efeito medido na simulação: a usuária com 3 atrasadas passou a 1 — as duas rotinas diárias que ela retomou na semana deixaram de cobrar os dias perdidos (que seguem na aderência). Harness 20/20.
- **Herói "Comece por esta"** nasce da mesma função (rotina vital · mais dias sem fazer · ocorrência mais recente); sem atraso, é a primeira aberta da agenda de hoje. Não usa mais `KPI.proximaAcao` (que enxerga as perdas históricas).
- **Testado no navegador (simulador, 3 perfis × 2 temas, 375 px e 1440 px):** 0 erros de console; concluir pelo herói abre o relato de 60+, grava, repinta ("Suas atrasadas 0 · nada vencido"); sem rolagem horizontal no celular.
- Commits na branch `tela/hoje-v2`: ea5a2db · d78d649 · 1fd7b53 · 2b4b45c.

## 21. Reuniões v2 construída (16/09, noite) — branch `tela/hoje-v2`, commits 6bb2283 + seguinte

**O que é:** `projetos.html` reescrito (o nome do arquivo fica: o guard e o Hoje apontam para ele; `?r=<id>` abre a reunião).
- **Lista:** "Nova reunião" em uma linha (tipo · data · hora → Criar; convocação automática por tipo, `KPI.convocadosPorTipo`) · herói **"Hoje / A próxima"** (quórum, pendências da anterior, Conduzir, Vou, Copiar pauta) · aviso **"Sem ata"** com Fechar ata · **Placar de demandas** = `KPI.placarReuniao` sobre todas as decisões (Realizadas · Em andamento · Planejadas · Vencidas · Vencem hoje · % realizado, meta 90%) — a leitura da ATA do Bruno · **Tabela de demandas abertas** (Ação · Quem · Reunião · Prevista · Dias · Status) · lista Próximas | Passadas (toggle dentro do bloco).
- **Condução:** trilho de blocos com minutos (`ReunioesMotor.secoesDe` ou `pautaBlocos` dos sócios), relógio total e por bloco quando a reunião está iniciada no dia, setas ←/→. Blocos: **Abertura** (presença em lote + RSVP + falta justificada) · **O que ficou da anterior** (`KPI.rollforward2` + tratadas nesta reunião: Feito → concluir com relato / resolver · Não feito → registra andamento "não tratado" e rola · Assunto) com placar · **Placar da semana** (previsto × realizado por setor-raiz nos últimos 7 dias, meta 90%, "→ assunto") · **Planos do mês** (`pctPlano`/`escalonamentoPlano`, no prazo / fora do prazo) · **Assuntos** (itens + sugestões encaminhadas + pedidos pendentes; **Decidir** inline = O quê · Quem · Prazo · Setor → `criarAtividadeDeDecisao` + decisão com `atividadeId`; Resolvido; Próxima) · **6 temas da Integrada** (perguntas do checklist com ✅⚠️❌ gravadas em `reunioes.checklist`; ❌/⚠️ mostram Decidir) · **Fechamento** (demandas desta reunião, nota 1–10 com sugestão obrigatória abaixo de 8 em `notas[uid]` + `notaReuniao` = média, ata gerada por `ataTexto` + "O que ficou da anterior" + demandas, WhatsApp/Copiar, **Encerrar** = `resumoTexto` + `encerradaEm` e próxima instância da série com itens rolados).
- **Motor:** `reunioes-motor.js` ganhou `integrada: 'integrada_semanal'` (Abertura 5 · O que ficou 5 · Placar 5 · Evasão · Inadimplência · Comercial · Conformidade · Empregabilidade · Integração 10 cada · Fechamento 5 = 80 min), `perguntasDe(tipo, chave)` com o 00-CHECKLIST condensado, próxima instância semanal. Harness 92/92.
- **Campos novos gravados:** `checklist` (marcas por tema), `notas[uid]` (já era o contrato do motor), `conduzidaPor` no Iniciar, `origemReuniaoId` na atividade nascida de decisão. Tudo por `atualizarReuniao` (canWrite) — sem regra nova no Firestore.
- **Deixou de existir:** modal de nova reunião (13 campos), textarea de pauta livre, "Gerar pauta automática", chips de tipo × quando acima da lista, painel "Execução ao vivo" (o placar da semana + "→ assunto" cobre o uso), cascata "Encaminhar p/ pauta" (aceitar/descartar sugestão continua). Varredura de únicas antigas mantida (1×/carga, só se alguma decisão aponta para elas).
- **Testado no simulador (gestor):** lista sem erro de console; abrir pelo "Fechar ata"; setas de teclado; Feito com relato (status "feita com atraso"); Fechamento com ata prévia; Encerrar → Encerrada + Copiar ata + Reabrir; Integrada: 10 blocos, ❌ → Decidir → Criar demanda → decisão no Fechamento e na ata. 0 erros de console em todos os passos.
- **Limitações declaradas:** demanda para outro setor nasce como atividade (o "pedido com aceite" do R12 §3.3 depende das regras R12, ainda não publicadas); relógio só corre no dia da reunião iniciada; nota só para quem tem escrita (regra atual do Firestore).

## 22. Planejamento v2 construído (16/09, noite) — branch `tela/hoje-v2`

**O que é:** `planejamento.html` reescrito na estrutura aprovada (LIVRO: grade mês × setor, célula vazia cria, farol de 3 campos; AUDITORIA §6: 3 números + check-in, grid editável Notion) com as colunas da planilha PLANEJAMENTO MENSAL — MODELO do Bruno.
- **Topo:** Realizado (concluídos ÷ fechados) · Itens em risco (farol amarelo/vermelho ou prazo vencido) · Setores sem plano (só setor com líder) + "Acompanhar esta semana" (check-in).
- **Grade ago/set/out × setores-raiz:** célula = n itens · estado (rascunho D-5/D-3/D-0 · entregue · entregue com atraso · aprovado) · % realizado · faróis; setor sem líder = "plano opcional", sem cobrança; clique abre o plano; célula vazia cria (do zero ou copiando o mês anterior).
- **Plano do setor:** semana do setor (seg–dom, das datas dos itens); grade **5W2H editável na célula** — O quê · Onde · Como · Quem · Quando (início) · Quanto (R$) · Prazo · Status · Semana — Enter salva, Esc cancela, trava otimista (`atualizarLista` com `atualizadoEm`); seções por subsetor; linha "novo item" (quem = líder, prazo = fim do mês); Concluir (data, relato ≥ 60, evidência, custo final) · Não feito (motivo); alçada R$ 200 (gestor E sócio, quem criou não assina); Entregar plano; ciência gestor/sócio; sugestões do manual de riscos recolhidas em uma linha ("Incluir no plano"); "sem nota ainda" enquanto nada fechou.
- **Check-in da semana:** 3 campos por item aberto (fez o quê · 🟢🟡🔴 · o que trava) gravados de uma vez em `acompanhamentos[AAAA-Www]`; amarelo/vermelho cria `pauta_sugestoes` (destino Reunião de Líderes, origem planejamento/item, sem duplicar) — a Reuniões v2 mostra em Assuntos.
- **Campos:** item ganhou `onde`, `inicio`, `status`, `relato`, `evidencia`, `subsetorSigla` (a coleção está vazia em produção; motor e KPI seguem lendo `quandoPrevisto`/`quandoRealizado`/`naoFeito`).
- **Deixou de existir:** ranking (Performance), eixo "o que vem / o que foi", 3 faixas de aviso, modal de item, dispensa de risco com assinaturas (o risco continua sugerido; dispensar volta quando fizer falta).
- **Testado no simulador (gestor):** 0 erros de console; grade e 3 números; edição na célula grava (Enter no input); adicionar item; check-in 🟡 + motivo → plano gravado + sugestão de pauta criada. Ressalva de teste: a tecla Return da ferramenta de navegador não chega ao input — o Enter real (disparado no input) funciona.

## 23. Planejamento v2 · líder e membro (17/09, madrugada) — branch `tela/hoje-v2`, commit faffe3f

**Pedido do Bruno (16/09, noite):** "Temos a ligação quando um Setor faz seu planejamento (...) precisa fazer em cima de KPI's de setor (...) podendo chamar outro líder, outro líder precisa aceitar. Teremos previsto, realizado, indicador de prepara que amanhã você tem isso, você atrasou ou fulaninho atrasou, verificar se foi feito (...) Segue com o usuário de líder e usuário de membro de setor."

**Decisões (por benchmark e pelas regras do banco, sem perguntar):**
- **Item nasce de um indicador do setor.** `kpis-setor.js` (novo, só dados): 46 indicadores em 7 setores-raiz (PED 8 · CRA 7 · CSA 7 · COM 6 · SEC 8 · AGE 6 · GES 4), com meta quando o checklist da Integrada/manuais dão (ex.: inadimplência GT 9,3% · GP 11%). Coluna **Indicador** na grade 5W2H (select) e linha de cobertura no topo do plano: "N de M indicadores do setor com item neste mês" + os que estão sem item. Regra Marr/Parmenter: KPI → pergunta → ação; o que não tem item não vai mexer.
- **Chamar outro setor = pedido com aceite.** Coluna **Com quem**: chips por setor (`aguarda` / `✓ aceito` / `✗ recusado` com motivo no title). O líder do plano chama por "+ setor" (só setores com líder). O líder chamado vê **"N pedidos de outros setores esperam a sua resposta"** (Planejamento, acima da grade) e a faixa "Exige você" no Hoje; responde Aceitar / Não posso (motivo obrigatório). Como a regra atual do Firestore só deixa o líder do próprio setor escrever no plano, a resposta vai em `solicitacoes` `{tipo:'parceiro_plano', status:'pendente', resposta:'aceito'|'recusado', motivo, planejamentoId, itemId, setorSigla, setorOrigem, competencia, tituloItem, solicitanteUid, solicitanteNome}` — regra `create` (solicitanteUid == auth && status == 'pendente') aceita. `projetos.html` e `atividades.html` ignoram esse tipo nas pendências.
- **Membro não escreve no plano (regra do banco) → o item dele vira atividade única na agenda.** Botão "→ agenda" no item aberto cujo QUEM é membro, e automático ao trocar o QUEM para um membro: cria `atividades {recorrencia:'unico', data: prazo, origem:{tipo:'planejamento', planejamentoId, itemId, setorSigla, competencia}, origemTipo:'planejamento'}` e grava `item.atividadeId`. O membro conclui no Hoje com relato (fluxo que já existe). O plano lê `ocorrencias where atividadeId in [...]` (lotes de 30) e mostra **"feito por Maria em 15/09" + "Verificar ✓"**; verificar = item concluído com `quandoRealizado` do dia da conclusão, relato copiado, `evidencia:'relato na atividade'`, `verificadoPor{uid,nome,em}` → pílula "verificado por Antonia".
- **Prazo com nome:** pílulas "vence amanhã · Maria", "vence hoje · X", "vencido há Nd · Maria" na coluna Status (Todoist/Asana: quem e quando, sem filtro).
- **Membro no Planejamento:** abre no plano do setor onde está lotado (`usuarios.setor`, raiz do subsetor), só leitura, linhas dele destacadas, texto "Você tem N item(ns) neste plano (...) você conclui no Hoje e o líder verifica aqui"; no lugar do check-in, cartão **"Seu plano · Secretaria — N itens seus · vencidos · vence(m) amanhã → Ver o plano"**.
- **Hoje:** bloco **"Do plano do setor"** (itens meus abertos por prazo: "há 2 dias" vermelho, "amanhã"/"hoje" âmbar, data; indicador pelo nome; "na sua agenda" quando já é atividade; "feito · aguarda o líder verificar"); líder ganha na faixa "Exige você" o item "N pedido(s) de outro setor espera(m) sua resposta → Responder" (abre o Planejamento). Custo: +1 leitura (`planejamentos where competencia == mês`, ≤100 docs) e, para líder, +1 (`solicitacoes pendentes`).
- **Bug corrigido de carona:** `hoje.html` estava com uma aspa perdida no link "Fechar ata" (`'&bloco=fim;`) desde o commit 63fe1f0 — o script inteiro não carregava. A verificação anterior foi feita antes desse commit. Agora todo commit passa por `new vm.Script` em cada bloco `<script>`.

**Testado no simulador (17/09, 00h):** 0 erros de console em Planejamento (líder Antonia/SEC e membro Maria) e Hoje (membro e líder). Fluxos clicados: Aceitar pedido do CRA → `solicitacoes` criada (resposta aceito) + log, bloco some; Verificar ✓ no item da Maria → item concluído 15/09, relato copiado, verificadoPor Antonia; "→ agenda" em "Enviar SISTEC" → atividade única criada (17/09, Maria, subsetor ADM, origem plano) e item ligado; "+ setor" → PED → chip "PED · aguarda"; troca de indicador na célula grava. 375 px sem rolagem lateral. Harness: pendências 20/20 · planejamento 67/67 · reuniões 92/92 (com o motor da worktree). Capturas em `shots/planejamento3_*` e `hoje3_*`.

- **Ordem das colunas (crítica da captura, commit seguinte a faffe3f):** em 1440 px a grade cortava justamente Prazo · Status · Semana atrás da rolagem horizontal. Agora: O quê · Indicador · Quem · Com quem · Prazo · Status · Semana (visíveis) e Como · Onde · Quando · Quanto (à direita, rolam). Regra Asana/Linear: ação antes do detalhe.

**Pendente (declarado):** o gestor não recebe pedidos de setor (só líder chamado); "Não posso" não devolve o item ao líder de origem além do chip ✗ — se o Bruno quiser, vira assunto na Reunião de Líderes; o membro não pode pedir mudança de prazo do item (só pela atividade, adiar). Merge em `publicar/2026-09-16` continua esperando o OK do Bruno.

## 24. Planejamento v2 · tela de partida da líder e campos da planilha do Bruno (17/09, madrugada) — branch `tela/hoje-v2`

**Pergunta do Bruno:** "Como a líder desenvolve o planejamento do setor dela? Atividades do mês, turmas, quando, onde, com quem, setor convidado, data prevista, data realizada, observações, custo previsto (preciso aprovar) e realizado, data de realização e status. A tela dela para começar, como será?"

**Campo a campo (o que existe · onde):** atividades do mês = linhas "O quê" (uma por item, Enter salva) · turmas = **novo**, no detalhe · quando = Início previsto (detalhe) + Prazo (grade) · onde = detalhe · com quem (pessoas) = **novo**, no detalhe · setor convidado = coluna "Setor convidado" (chips com aceite do outro líder) · data prevista = Prazo · data realizada = "Realizado em" (preenchida na conclusão, editável depois no detalhe) · observações = **novo** campo "Observações" no detalhe (o relato de 60+ continua obrigatório na conclusão) · custo previsto = coluna Custo, com alçada (> R$ 200 trava até gestor + sócio assinarem) · custo realizado = "Custo realizado" (pedido na conclusão, editável no detalhe; a grade mostra "previsto → realizado") · status = coluna Status (aberto · vence hoje/amanhã · vencido há N · feito por X · verificado · ✓ · ✗).

**Tela de partida (outubro, plano vazio):** "0 de 8 indicadores do setor com item neste mês" + os 8 indicadores como botões. Clicar num indicador troca o placeholder da linha de adicionar para "O que vai ser feito para mover «SISTEC/Censo em dia»?" e foca o campo; Enter cria o item já com o indicador, quem = líder, prazo = fim do mês, e **abre a linha de detalhe** para completar turmas · onde · com quem · início · custo · observações. Alternativas na mesma tela: copiar o mês anterior (ao criar o plano) e as sugestões de risco do setor.

**Grade:** 10 colunas de ação (▸ · O quê · Indicador · Quem · Setor convidado · Prazo · Custo · Status · Semana · ×); o detalhe abre na própria linha (▸), sem modal, editável na célula como o resto. Link direto `planejamento.html?setor=SEC&comp=2026-10&item=o1` abre o plano e o detalhe do item (serve para o Hoje apontar para o item).

**Simulador:** plano `pl_sec_2610` (OUT/26, 1 item completo) e cenário `?cenario=out_vazio` (plano vazio) para as capturas da tela de partida. Testado clicando: indicador → item → detalhe aberto → Turmas gravada; 0 erros de console. Capturas `shots/planejamento6_*`.

## 25. Regra "cada um vê só a sua tela" aplicada (17/09, madrugada) — branch `tela/hoje-v2`

**Correção de rumo, não regra nova.** Bruno: "O líder só vê a tela dele. A regra não mudou. Releia." A regra estava na §9-b (16/09, manhã): *"Líder não vê o planejamento dos outros setores — só as tarefas/atividades que têm interseção com o setor dele"* e no Livro do Produto: *"equipe vê o plano do próprio setor, só líder edita"*. O Planejamento v2 tinha nascido com a grade de todos os setores e os números da unidade para todo mundo — erro meu, corrigido:
- **Planejamento:** gestor/sócio = unidade inteira (como antes). **Líder** = só o(s) setor(es) que lidera: os 3 números são do setor, a grade mês × setor tem só a linha dele, e o terceiro número deixa de ser "setores sem plano" e vira **"Plano de out/26 · rascunho · entregar até 25/09 · D-8"**. **Membro** = só o setor onde está lotado (leitura). O pedido de outro setor continua aparecendo — é a interseção — mas sem "Ver plano". Link direto (`?setor=`) só dentro do escopo.
- **Reuniões ("idem para reunião"):** quem não é gestor vê só as reuniões com interseção com ele — convocado, participante, presente ou criador — ou do setor que lidera. **Tipos novos:** "Alinhamento entre líderes" (escolhe o setor; convoca o líder de lá automaticamente) e "Externa · com alguém de fora" (campo "com quem: nome · empresa", gravado em `convidadosExternos`; só quem cria é convocado). Roteiro: `avulsa` (50 min), sem próxima automática.
- **Hoje = controle de atividades E compromissos:** reunião de hoje em que a pessoa está convocada entra na **Agenda de hoje** como compromisso (hora · 📅 título · com quem/N convocados · Pauta → ou Entrar → quando em andamento) antes das ocorrências; o contador da agenda soma as reuniões.
- **Simulador:** "hoje" passou a seguir o relógio real (o teste virou o dia às 00h); reuniões `r_externa_hoje` (Antonia + consultor da franqueadora, 14h) e `r_alinh_amanha` (Antonia + Kamile/CRA, 10h). Verificado nos 3 perfis: 0 erros de console; Antonia vê Secretaria só; Maria vê o plano da SEC (leitura) e nenhuma reunião além das dela; gestor mantém a unidade. Criar reunião externa pela linha "Nova reunião" grava título "Externa · <nome>", convidado externo e 1 convocado.

- **17/09, 00h50 — cabeçalhos em verde (pedido do Bruno):** todo rótulo em caixa alta (seções, colunas da grade, grupos, dias da semana, rótulos dos cartões e do detalhe) usa `--accentText` (verde de texto da marca, calibrado nos 2 temas) em Planejamento, Reuniões e Hoje. Commit seguinte a 4c261de.

## 26. Plano ↔ agenda e avisos animados (17/09, 01h) — branch `tela/hoje-v2`

**Pedido do Bruno:** "planejamento pode dizer que quer item aparecendo na agenda da unidade para ser visto por todos, no dia; todos os eventos da unidade devem ser avisados a todos (líderes e usuários) de forma animada; setor tem sua própria agenda no mesmo formato; mensagem animada do setor só para a equipe e convidados."
- **Item do plano → agenda:** no detalhe do item, "Divulgar na agenda" = só no plano · agenda do setor · agenda da unidade. Cria um doc em `eventos` (contrato já usado por `eventos.html`/`agenda-motor.js`: `siglaSetor` (null = unidade) · `hora` · `local` (= onde) · `categoria:'evento'` · `planoId`/`itemId`/`origem` · `convocadosUids` = líderes dos setores convidados · `custoPrevisto`). O agenda-motor já pinta 🟢 "plano do seu setor" quando há `planoId` e o setor é o meu. Editar título/datas/onde do item sincroniza o evento; "só no plano" desativa; concluir marca `realizado`. Regra do Firestore para `eventos`: create/update por `canWrite()` — líder pode.
- **Hoje avisa de forma animada:** faixa 📣 no topo, para todos os perfis (1 leitura: `eventos where data in [hoje, amanhã]`): evento da unidade → todo mundo; evento do setor → equipe do setor (lotação/liderança) e convidados; "Amanhã: …" para se preparar. Entra deslizando, o megafone pulsa 3 vezes e para; `prefers-reduced-motion` desliga. Evento em que a pessoa foi convidada também entra na "Agenda de hoje" (com hora e "Agenda →"; "Responder →" se sem resposta).
- **Decisão registrada (Bruno, 17/09 00h50):** *"se aplicativo for fato impeditivo, tudo vira desktop; só agenda do setor e da unidade aparecem com formatação para celular; as demais não"* → celular é obrigatório só em `eventos.html` (unidade e setor); as outras telas são desktop (continuam funcionando em 375 px, mas não é requisito).
- **Simulador:** eventos passaram ao contrato real (`siglaSetor`/`hora`/`local`), datas relativas; evento da unidade hoje 10h (visita da franqueadora), evento da SEC hoje 14h (Maria convidada), item i3 do plano na agenda do setor (`e_plano_sec_i3`); cenário `?cenario=dez` = plano da SEC com 10 itens. Testado: Divulgar → evento criado com `siglaSetor:null` e `planoId`; avisos nos 3 perfis; 0 erros de console.

## 27. Demais abas com o mesmo conceito + auditoria geral (17/09, 01h–02h) — branch `tela/hoje-v2`

**Pedido do Bruno:** "segue para as demais abas aplicando o mesmo conceito; ao concluir roda uma auditoria geral e sobe — amanhã quero chegar na escola e ver o sistema."
- **Cabeçalhos em verde** (`--accentText`) em todas as telas que têm rótulos em caixa alta: Hoje, Reuniões, Planejamento, Atividades, Performance, Riscos, Importação (as demais não usam esse tipo de rótulo).
- **Atividades:** período · busca · classificação ficam atrás de um único botão "Filtros" (abre sozinho quando há filtro ativo e lembra a escolha). Controles acima da dobra: 54 → 11. Navegação de setores já era só do escopo do líder ("Meu escopo").
- **Agenda (`eventos.html`) — única tela obrigatória no celular:** em ≤ 900 px a barra lateral some (menu pelo botão flutuante), topo compacto, barra de comandos em linhas, visão mês rola dentro da própria grade; visão semana empilha os dias. Verificado em 375 px: sem rolagem lateral da página.
- **Inteligência:** seletor "Meu escopo" para o líder; "Planos de ação vivos" só com interseção com quem abriu (dono, setor que lidera, atividade do recorte). Performance já era recortada.
- **Navegação:** Cockpit e Riscos saíram do menu (plano aprovado 16/09; as páginas continuam por URL).
- **Repositório público:** e-mails de exemplo com nomes reais trocados por `nome@escola.com.br`.
- **Auditoria estática:** sintaxe de 16 telas + 44 JS (vm.Script) OK; ES5 OK (o único apontamento é o script-módulo do login, esperado); sem chave de API nos HTML. Harnesses: pendências 20/20 · planejamento 67/67 · agenda 150/150 · permissões 42 OK · entregues 13 OK · usuários 120 OK · inteligência 31/31 · reuniões 92/92 (pareto: harness exige rodar sem argumento, motor não mudou).
- **Auditoria de console (headless Chrome, 13 telas × 4 perfis):** ver linha abaixo, preenchida ao fim da varredura.
- **Auditoria de console concluída (17/09, 02h05):** navegador embutido, 13 telas × 4 perfis (usuário, líder, gestor, sócio), temas claro e escuro = **52 carregamentos, 0 erros de console**. Recorte por perfil conferido: Performance e Inteligência do líder só com o setor dele; Atividades "Meu escopo"; Planejamento e Reuniões conforme §25.
- **Publicação:** `tela/hoje-v2` levada por fast-forward para `publicar/2026-09-16` (worktree `~/GERA_publicar`) e enviada ao GitHub. `origin/main` estava em 61d6bd0 (= a publicação de 16/09); a Netlify publica a partir do `main` (conferir no painel) — o passo final de levar `publicar/2026-09-16` ao `main` é do Bruno (regra do projeto: eu não faço deploy de produção).

## 28. Desafio "5 a 10 melhorias" (17/09, 02h30–03h) — branch `tela/hoje-v2`

Seis entraram na mesma noite (pequenas, testadas no simulador nos 3 perfis, 0 erros de console):
1. **Item ↔ atividade sincronizados:** trocar quem, prazo ou título de um item ligado a uma atividade única atualiza a atividade na agenda da pessoa (antes ficava desatualizada).
2. **Faixa do líder:** "N item(ns) do plano vencido(s) · nome · há N dias → Ver no plano" (abre direto no item).
3. **Faixa do gestor:** "N setores sem plano entregue de MM/AA · entrega até 25 · D-N" a partir de D-10 (o Hoje passou a ler os planos do mês atual e do próximo: 1 leitura).
4. **Cartão "Plano de <próximo mês>" clicável:** abre o plano ou cria (líder); o "i" continua só informativo.
5. **"Do plano do setor" no Hoje:** "abrir →" leva ao item no plano (`?setor=&comp=&item=`).
6. **Hora no item do plano:** campo "Hora (agenda)" no detalhe; vai para o evento (agenda) e para o aviso do Hoje.

Quatro ficam para a próxima rodada, com motivo: 7. Hoje auto-atualizando a cada 10 min (custo de leitura no plano Spark a medir com uso real); 8. Inteligência e Performance em cartões sem "lentes" (rodada própria, plano aprovado); 9. Atividades com um só botão "Nova"; 10. "✓ verificado pelo líder" visível ao membro por um dia.

## 29. Conclusão da madrugada: sincronizações, melhorias 7·9·10, manual por perfil, PDF e PowerPoint (17/09, 03h–08h)

- **Sincronizações que faltavam (auditoria pedida pelo Bruno):** copiar o mês anterior leva indicador, turmas e "com quem"; remover item ou marcar "não feito" desativa a atividade ligada e o evento da agenda; concluir no plano fecha a ocorrência da atividade ligada (se ainda aberta) e marca o evento como realizado; verificar marca o evento realizado. **Não sincronizado (declarado):** editar a atividade em Atividades ou o evento em Eventos não volta para o item do plano (sentido inverso) — fica para a próxima rodada.
- **Melhorias 7, 9 e 10 entregues:** Hoje se atualiza sozinho a cada 10 min com a aba visível e sem modal aberto (e ao voltar para a aba); Atividades com um só botão "Nova ▾" (catálogo · do zero · inativas); membro vê "verificado ✓ por <líder>" no Hoje por 24 h. **8 (Inteligência/Performance em cartões) fica declarada** — é redesenho, não cabia antes da publicação.
- **Manual dentro do sistema (`manual.html`)**, no menu de todos os perfis, abre na aba do perfil de quem entrou (Gestor e sócios · Líder · Membro · As telas). Mesmo conteúdo do PDF e da apresentação.
- **Entregáveis:** `GERA_Manual_do_Lider.pdf` (A4, frente e verso) e `GERA_Apresentacao.pptx` (12 slides, 16:9, com capturas do simulador), gerados em `scratchpad/entrega/` e enviados ao Bruno. python-pptx 1.0.2 instalado em venv isolado no scratchpad (não no sistema).
- Testado no simulador: menu Nova, linha "verificado ✓", remover/não feito desativam a atividade, concluir grava a ocorrência, manual nos 3 perfis; auditoria estática 17 telas OK.

- **08h20 — sentido inverso feito:** editar uma atividade nascida do plano (quem, data, título) em Atividades atualiza o item do plano; editar um evento nascido do plano (data → início, hora, título, local → onde) em Eventos atualiza o item. Transação no doc do plano; nunca bloqueia a edição; erro só no console. **Cadastro:** Usuários avisa "N usuário(s) sem setor de lotação" com os nomes.

- **PUBLICADO 17/09 08h25:** Bruno enviou `publicar/2026-09-16` → `main` (61d6bd0..acfb8c9). Netlify: deploy 6aabe9ab9025490008b4ac4c `ready`. Conferido no ar: manual.html 200, kpis-setor.js 200, hoje.html com avisos animados, planejamento.html com "Setor convidado", guard.js com Manual no menu.

## 30. Retorno do Bruno no primeiro uso (17/09, 09h) — correções

- **Telas "sem tamanho total":** os contêineres tinham teto de 1040–1180 px; em monitor grande sobrava vazio e parecia aplicativo. Teto passou a 1600 px (Hoje, Planejamento, Reuniões). Atividades e Agenda já eram fluidos.
- **Planejamento do mês seguinte sempre aberto:** a janela 25–28 deixou de bloquear a criação; só fica registrado `foraDaJanela`. Testado: gestor cria out/26 fora da janela.
- **Item recorrente:** no detalhe do item, "Repetir nos próximos meses" (1 · 2 · 3 · 5 · 11). Cria o plano de cada mês se não existir, copia o item (prazo no mesmo dia do mês), liga a atividade do membro, marca ↻ na origem e "↻ recorrente" nas cópias. Testado: 2 meses → plano de nov/26 criado.
- **Atividades:** contagem "N vitais · N importantes · N rotina" no cabeçalho do painel (escopo e setor). A classificação em produção só aparece depois de aplicar `ARQUIVOS PARETTO/2026-09-16_DELTA_CONSOLIDADO_v1.json` na Importar (pendente do Bruno).

## 31. Gráficos por perfil no Hoje + preparo de reunião (17/09, 10h) — antes da reunião das 14h

- **Gestor:** "Atrasadas por setor e idade" (empilhado 1–2 · 3–7 · 8+ dias; clique abre o setor) e "Plano do mês por setor" (realizado = concluídos ÷ fechados; "sem plano" para setor com líder e sem plano; clique abre o plano).
- **Líder:** "Aderência da equipe · 7 dias" por pessoa com a linha da meta 90% (clique abre a Performance) e "O que mais trava" (travas abertas por motivo; clique abre Atividades).
- **Líder e membro:** "Sua semana" — 7 bolinhas (verde dia fechado, âmbar parcial, vermelho nada feito, cinza sem rotina) + "N de M dias fechados".
- **Preparo:** o aviso "Amanhã:" do Hoje inclui as reuniões em que a pessoa está convocada e quantos assuntos dela estão na pauta.
- Tudo sem biblioteca (barras em CSS), com o "i" (fórmula · dados · números · para que serve) e clique que abre a lista. 0 erros de console nos 3 perfis. Resumo por WhatsApp ao encerrar já existia (Fechamento).
- **Não feito, declarado:** modo condução no celular e pauta com convocações sem resposta (próxima rodada).

- **17/09 12h30 — melhoria 8 (a última do desafio):** Performance e Inteligência sem a barra de "lentes". `lentes.js` ganhou o modo `semBarra`: a tela mostra numa rolagem só todos os blocos das lentes que o perfil tem (membro: eu faço + números; líder/gestor: as três), na ordem do DOM; a barra some. Testado: Performance líder 6/6 blocos, Inteligência gestor 14/14, 0 erros. Service worker conferido: rede primeiro, sem risco de versão velha em produção.
