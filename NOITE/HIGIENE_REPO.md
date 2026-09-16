# Higiene do repositório — PROPOSTA (nada foi removido)

## 1. Achado que vem primeiro: o repositório inteiro é público

O Netlify publica **tudo** o que está na raiz do repositório. Conferido no ar em 16/09:

```
https://agendagestaograutecnico.netlify.app/LEIA-ME.md                  → 200
https://agendagestaograutecnico.netlify.app/ARCH_EVENTOS_CALENDARIO.md  → 200
https://agendagestaograutecnico.netlify.app/HANDOFF_SESSAO_CONCLUSAO.md → 200
```

Ou seja: qualquer pessoa com o endereço lê os documentos internos, sem login. O `guard.js`
protege as telas, não os arquivos soltos.

**Por isso eu NÃO commitei** nesta noite: o histórico de 85 KB do `ESTADO.md` e os documentos
de trabalho da noite (`NOITE/DUVIDAS.md`, `NOITE/*_HANDOFF.md`, `NOITE/harness_*.js`). Eles
estão no seu Mac, em `~/GERA/NOITE/`, prontos para entrar quando você decidir como tratar isso.
O A4 do prompt também só me dava permissão de commitar `ESTADO.md` e este arquivo.

**Como resolver (escolha sua, 5 minutos):**
- **(a) Mais simples:** mover todo documento para uma pasta `docs/` e publicar só o necessário,
  com um `netlify.toml` apontando o diretório publicado.
- **(b) Menos invasivo:** manter tudo onde está e adicionar um `_redirects` devolvendo 404 para
  `/*.md`. Uma linha.
- **Não fiz nenhuma das duas** porque mexer na configuração de publicação pode derrubar o site
  no dia do go-live. Isso precisa ser feito com você olhando.

## 2. O que sobra no repositório sem servir ao site

| Arquivo | Por que sai |
|---|---|
| `harness_f1e.js` `f1f` `f1g` `f1h` `f1i` `f1l` `n2` `r3` `r4` `r5` (10 arquivos, ~62 KB) | são testes de lotes já fechados; nenhuma tela carrega |
| `PROVA_L35.html` | página de prova de um lote concluído |
| `kpi_ext_n2.js` | o cabeçalho do próprio arquivo diz "NÃO SUBIR AO GITHUB" |
| `ARCH_*.md`, `HANDOFF_SESSAO_CONCLUSAO.md`, `N5_LEMBRETES_GOOGLE_PASSO_A_PASSO.md` | documentos de trabalho publicados junto com o site |

Total: cerca de 15 arquivos que o navegador nunca pede.

## 3. O que falta e faz falta

- **`.gitignore`** — o repositório não tem nenhum. Qualquer `.DS_Store` ou arquivo temporário entra sem aviso.
- **Cache-busting** (`?v=`) nos `<script>` e `<link>` — hoje dá para um usuário ficar com o JS velho e o CSS novo depois de um deploy.
- **`_headers`** com as proteções básicas (`X-Content-Type-Options`, `Referrer-Policy`).

## 4. Regra que eu sugiro adotar

Documento de trabalho (handoff, estado, prova, teste) **não mora junto com o que vai ao ar**.
O código vai para o repositório publicado; o resto vai para o Drive ou para uma pasta que o
Netlify não publica. Enquanto essa separação não existir, todo documento novo aumenta a
superfície pública do sistema.
