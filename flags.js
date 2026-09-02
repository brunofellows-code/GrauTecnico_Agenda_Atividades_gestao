/* GERA — flags.js (v1 · 12/08/2026). Kill-switch por módulo
   (PROTOCOLO_QUALIDADE): incomodou → false desliga sem rollback.
   ES5. Carregar ANTES dos demais scripts. */
window.FLAGS = {
  cockpit: true,        /* HOJE como cockpit (Lote 3) */
  pautas: true,         /* séries Fellow (Lote 5) */
  checkins: true,       /* check-in semanal OKR (Lote 4) */
  ranking: true,        /* Top 3 + posição (Lote 3) */
  quickAdd: true,       /* N + parsing PT-BR (Lote 3) */
  paletaComando: true,  /* Ctrl+K (Lote 3) */
  comentarios: true,    /* @menção (Lote 3) */
  undoToast: true,      /* undo em vez de confirmação (Lote 3) */
  seedOnboarding: true, /* 1º login com exemplos (Lote 3) */
  exportExecutivo: true,/* PDF diretoria (Lote 4) */
  feedbackInApp: true,  /* sugerir melhoria (Lote 3) */
  kanban: false,        /* 2ª lente (Lote 4; nasce OFF) */
  horasEsforco: false   /* DECISÃO: oculto no lançamento */
};
