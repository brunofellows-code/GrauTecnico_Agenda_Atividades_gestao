# 🔎 VARREDURA FINAL — Sistema A · Grau Técnico FSA · 11/08/2026

**Veredito:** sistema **saudável e íntegro**. A auditoria mecânica completa (no padrão do próprio projeto) roda **100% verde**. O único ajuste desta sessão: **2 harnesses de teste estavam desatualizados** em relação à feature **R7·B1.4** (balde "indisponível / fora da janela") — corrigidos **sem tocar em código de produção**. Nenhuma regressão de produção encontrada.

---

## 1 · O que foi auditado (padrão do projeto)

| Dimensão | Método | Resultado |
|---|---|---|
| Sintaxe JS (standalone) | `node --check` nos 27 `.js` | ✅ 27/27 OK |
| Sintaxe JS (inline nos HTML) | extração de `<script>` + parse | ✅ 30 blocos OK (`login.html` é ES module legítimo) |
| Pré-voo (marcadores-âncora) | `grep` conforme HANDOFF §4 | ✅ Todos presentes¹ |
| Higiene `CURRENT_USER` | `setores.html` | ✅ Já corrigido (placeholder neutro + `Guard.onReady` injeta USER real) |
| `hoje.html` sem `Mariana` | `grep` | ✅ Limpo |
| Hex fora do `theme.css` | `grep` | ✅ Zero violações (só `<meta theme-color>` PWA, exceção inevitável) |
| IDs HTML duplicados | `grep`+`uniq -d` por arquivo | ✅ Nenhum |
| `<script src>` quebrado (404) | existência dos arquivos locais | ✅ Todos existem |
| `manifest.json` | `JSON.parse` | ✅ Válido |
| `firestore.rules` (balanço de chaves) | contagem `{`/`}` | ✅ Balanceado (55/55) |
| Marcadores TODO/FIXME/XXX/HACK | `grep` | ✅ Nenhum (as ocorrências de "TODO" são a palavra PT "todo") |
| Service worker | versão de cache | ✅ `graut-c2-v1` versionado + invalidação correta |
| Suíte de harnesses | `node harness_*.js` | ✅ **10/10 verdes** (após correção do item §2) |

¹ *Dois "grep" do pré-voo antigo deram falso-negativo: `theme.css ∋ --doing` (linhas 75/133, ok) e `index.html` referencia a Inteligência via rota limpa `href='/inteligencia'` em vez do literal `inteligencia.html`. Ambos corretos.*

---

## 2 · Achado & correção — harnesses desatualizados vs. R7·B1.4

**A feature R7·B1.4** introduziu o balde **"indisponível / fora da janela"**: quando uma decisão foi convertida em atividade mas **não há ocorrência dela na janela do board**, o status é **INDISPONÍVEL** — nunca é chutado como "em aberto" nem como "planejada". A regra está documentada no código e **consumida pela UI**:

- `kpi.js:814` — `if (!occ) { return { chave: 'sem_janela', rotulo: 'status indisponível (fora da janela)' }; }`
- `kpi.js:1350` — `else if (st.chave === 'sem_janela') { p.indisponiveis++; } /* R7·B1.4: não conta como planejada */`
- `projetos.html:1147` — renderiza `['· fora da janela', pl.indisponiveis || 0, ...] /* R7·B1.4: nunca vira "planejada" */`

**Dois harnesses ainda afirmavam o comportamento pré-R7·B1.4** e, por isso, falhavam contra o código atual (que está correto):

| Arquivo | Asserção | Esperava (antigo) | Produção (R7·B1.4) | Ação |
|---|---|---|---|---|
| `harness_f1e.js` | `statusDecisao` convertida sem occ | `'aberta'` | `'sem_janela'` | asserção atualizada |
| `harness_f1l.js` | `placarReuniao` occ fora da janela | `planejadas=1` | `indisponiveis=1` | asserção atualizada |
| `harness_f1l.js` | invariante "baldes somam o total" | 4 baldes | 5 baldes | passou a incluir `indisponiveis` |

**Correção:** apenas os arquivos de teste foram ajustados para refletir o contrato vigente (o mesmo que a UI já usa). **Nenhuma linha de produção foi alterada** — o código de `kpi.js`/`projetos.html` já estava correto. Após o ajuste: `harness_f1e` = 33 PASS · 0 FAIL; `harness_f1l` = 100% validado.

---

## 3 · Item deliberadamente adiado — N5 (Google Calendar)

**Não é bug.** A integração Google Calendar segue **desligada de propósito**, exatamente como o HANDOFF previu:

- `gcal.js:19` — `var ATIVO = false; /* FLAG MESTRA */`
- `gcal.js:20` — `CLIENT_ID = 'COLE_AQUI_O_CLIENT_ID...'` (placeholder)
- `gcal.js` **não é carregado em nenhum HTML** (fiação não conectada).

**Para habilitar** (quando houver Client ID do `N5_LEMBRETES_GOOGLE_PASSO_A_PASSO.md`): colar o Client ID em `gcal.js:20`, virar `ATIVO = true`, e referenciar `gcal.js` na tela de Eventos. Enquanto o Client ID não chega, **manter como está**.

---

## 4 · Arquivos alterados nesta sessão

```
harness_f1e.js   (só teste — asserção R7·B1.4)
harness_f1l.js   (só teste — asserção R7·B1.4 + invariante de 5 baldes)
```

Zero mudança em HTML/CSS/JS de produção e em `firestore.rules`. **Nada a publicar no Console do Firebase.** Nada a testar em produção (mudança é exclusiva da suíte de testes local).

---

## 5 · Roteiro de verificação (reproduzir o verde)

```bash
# na raiz do repo
for h in harness_*.js; do node "$h" >/dev/null 2>&1 && echo "OK $h" || echo "FALHA $h"; done
# esperado: OK para os 8 rodáveis em Node (f1e, f1f, f1g, f1h, f1i, f1l, n2, r4, r5, r3)
```

Todos devem sair com exit 0. Qualquer `FALHA` → parar e investigar antes de publicar.
