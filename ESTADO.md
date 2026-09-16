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

---

### Nota sobre o histórico
O histórico completo (julho e agosto, 85 KB) **não foi copiado para cá de propósito**: este repositório é publicado inteiro pelo Netlify, e qualquer `.md` aqui fica acessível na internet — conferido em 16/09 com resposta HTTP 200 para `LEIA-ME.md`, `ARCH_EVENTOS_CALENDARIO.md` e `HANDOFF_SESSAO_CONCLUSAO.md`. Enquanto isso não for resolvido (ver `NOITE/HIGIENE_REPO.md`), o histórico fica no Drive, e aqui mora só o estado corrente.
