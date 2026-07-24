# 📤 SUBIR — 4 arquivos (23-24/07/2026, auditados pelo Claude Code)

> ⚠️ Este pacote é **INCREMENTAL**: só substitui estes 4 arquivos no repositório.
> NÃO apague nada do GitHub — os outros arquivos (ui.js, theme.css, guard.js etc.) continuam como estão.

## Passo 1 — GitHub (3 arquivos)
No repositório `GrauTecnico_Agenda_Atividades_gestao` → **Add file → Upload files** → arraste:
- `planejamento.html`
- `projetos.html`
- `eventos.html`
Confirme o commit ("R6 — correções auditadas"). O Netlify publica sozinho em ~1 min.

## Passo 2 — Firebase (1 arquivo)
`firestore.rules` NÃO vai pro GitHub para valer — cole o conteúdo em:
**Firebase Console → Firestore Database → Rules → colar tudo → Publish.**
(Pode subir o arquivo no GitHub também, só como cópia de registro.)

## O que mudou (resumo)
| Arquivo | Mudanças |
|---|---|
| `eventos.html` | 🐛 **Fix do calendário quebrado** (`CURRENT_USER`→`USER`) · erros amigos (carregar/salvar/excluir/realizar) com detalhe técnico só no console |
| `planejamento.html` | ⭐ Herói "X/23 setores entregaram" (cor semântica + "i") · vazios com direção · legenda enxuta · célula de custo estourado em **âmbar** · botão único "cobrar ▾" (WhatsApp/E-mail) · trava anti-plano-duplicado |
| `projetos.html` | Contador "N de M convocado(s)" + Marcar todos/Limpar no modal Nova reunião · hints sem jargão (rollforward/GERA) · toast de erro em vermelho |
| `firestore.rules` | 🐛 Sugerir item de pauta como usuário comum era negado (faltava `atualizadoEm` no `hasOnly` de `pautaItens`) — corrigido no padrão da regra de aceite |

## Teste rápido depois do deploy (2 min)
1. Abrir **Eventos** → a agenda carrega (sem erro CURRENT_USER). ✅
2. Abrir **Planejamento** → o herói "X de 23 setores…" aparece no topo. ✅
3. **Reuniões → Nova reunião** → contador "N de M convocado(s)" + "Marcar todos". ✅
4. Logado como usuário comum → sugerir item de pauta numa reunião → salva sem erro de permissão. ✅

*Backup completo de antes das mudanças: `../BACKUP-Sistema_5w2h-2026-07-23`.*
