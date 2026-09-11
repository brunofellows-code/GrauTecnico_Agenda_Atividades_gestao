/* ============================================================================
   firestore-adapter.js · Camada de Adaptação Firestore → SCORES
   Sistema A · Grau Técnico FSA · Lote 3 (03/09/2026)
   
   Lê dados REAIS do Firestore e os transforma no formato que scores.js espera.
   Mapeia:
     responsavelUid/criadoPor → contrato de SCORES
     Collections: planejamentos, reunioes, atividades, usuarios
   
   Uso:
     ADAPTER.loadFromFirebase(uid, setorSigla).then(function(dados) {
       var cockpit = SCORES.cockpit('gestor', dados, null, '2026-09-04');
     });
   ============================================================================ */

(function () {
  'use strict';

  /* L3.5: o GERA usa o SDK MODULAR (import('./firebase.js')); window.firebase
     (compat) NUNCA existe. Só scores.js é dependência real. loadFromFirebase
     fica como caminho legado (só funciona se algum dia o compat for carregado). */
  if (!window.SCORES) {
    console.warn('firestore-adapter.js: Dependência falta (scores.js)');
    return;
  }

  window.ADAPTER = {
    /* Cache local para reduzir leituras */
    _cache: {},

    /* Carregar dados do Firestore real */
    loadFromFirebase: function (uid, setorSigla, callback) {
      if (!window.firebase || typeof window.firebase.firestore !== 'function') {
        if (callback) { callback(new Error('SDK compat ausente — use ADAPTER.fromContexto(ctx, user)'), null); }
        return;
      }
      var db = window.firebase.firestore();
      var hoje = new Date().toISOString().slice(0, 10);
      var dados = { atividades: [], usuarios: [], pessoas: [], reunioes: [], planos: [] };

      /* Ler atividades da coleção real */
      db.collection('atividades').get().then(function (snap) {
        snap.forEach(function (doc) {
          var a = doc.data();
          if (a.removido) return;
          dados.atividades.push({
            id: doc.id,
            titulo: a.titulo || '',
            descricao: a.descricao || '',
            responsavelUid: a.responsavelUid || a.criadoPor || '',
            setorSigla: a.setorSigla || '',
            dtPrevista: a.dtPrevista || null,
            dtRealizada: a.dtRealizada || null,
            status: a.status || 'pendente', /* L3.5: enum real (pendente) — 'aberta' não existe */
            prioridade: a.prioridade || 'média',
            bloqueiaOutros: a.bloqueiaOutros ? 1 : 0,
            criadoPor: a.criadoPor || ''
          });
        });

        /* Ler usuários para mapear uid → nome + setor */
        return db.collection('usuarios').get();
      }).then(function (snap) {
        snap.forEach(function (doc) {
          var u = doc.data();
          dados.usuarios.push({
            uid: u.uid || doc.id,
            nome: u.nome || 'Sem nome',
            setorSigla: u.setorSigla || '',
            email: u.email || '',
            role: u.role || 'usuario'
          });
        });

        /* Montar array 'pessoas' (pessoas ativas nos setores) */
        var porSetor = {};
        dados.atividades.forEach(function (a) {
          if (!porSetor[a.setorSigla]) {
            porSetor[a.setorSigla] = {};
          }
          if (a.responsavelUid) {
            if (!porSetor[a.setorSigla][a.responsavelUid]) {
              porSetor[a.setorSigla][a.responsavelUid] = { uid: a.responsavelUid, n: 0 };
            }
            porSetor[a.setorSigla][a.responsavelUid].n++;
          }
        });

        for (var setor in porSetor) {
          if (porSetor.hasOwnProperty(setor)) {
            for (var uidPes in porSetor[setor]) {
              if (porSetor[setor].hasOwnProperty(uidPes)) {
                var pessoa = porSetor[setor][uidPes];
                var usuario = null; /* L3.5: Array.prototype.find é ES2015 — laço ES5 */
                for (var iu = 0; iu < dados.usuarios.length; iu++) { if (dados.usuarios[iu].uid === uidPes) { usuario = dados.usuarios[iu]; break; } }
                dados.pessoas.push({
                  uid: pessoa.uid,
                  nome: usuario ? usuario.nome : 'Desconhecido',
                  setorSigla: setor,
                  nAtividadesAbertas: pessoa.n
                });
              }
            }
          }
        }

        /* Ler reuniões (básico para o cockpit) */
        return db.collection('reunioes').limit(100).get();
      }).then(function (snap) {
        snap.forEach(function (doc) {
          var r = doc.data();
          dados.reunioes.push({
            id: doc.id,
            titulo: r.titulo || 'Reunião',
            data: r.data || hoje,
            responsavelUid: r.responsavelUid || '',
            setorSigla: r.setorSigla || '',
            status: r.status || 'pendente'
          });
        });

        console.log('✓ Dados carregados do Firestore:', dados);
        if (callback) { callback(null, dados); }
        return dados;
      }).catch(function (err) {
        console.error('Erro ao carregar Firestore:', err);
        if (callback) { callback(err, null); }
      });
    },

    /* ============================================================
       L3.5 (11/09/2026) · fromContexto(ctx, user) — RÉGUA ÚNICA
       Recebe o ctx de KPI.carregar() JÁ carregado por hoje.html
       (board = ocorrências expandidas; ativ; setores; hoje) e devolve
       o contrato que scores.js espera. Zero leitura de banco.
       Tradução de enum (o scores.js — Lote 2, congelado — usa
       'feita'/'aberta' internamente; o banco usa concluida/pendente/
       em_andamento/reprogramada/pulada):
         concluida → 'feita' · pulada → ignorada · demais → 'aberta'
       'atrasada' NÃO é status: o scores.js deriva de dtPrevista.
       pessoas[] = agregação por responsável (KPI.computarPorPessoa
       quando existe) → contrato gargalo/ranking do scores.js.
       ============================================================ */
    fromContexto: function (ctx, user) {
      var dados = { atividades: [], usuarios: [], pessoas: [], reunioes: [], planos: [] };
      if (!ctx || !ctx.board) { return dados; }
      var board = ctx.board, hoje = ctx.hoje, i, o;
      for (i = 0; i < board.length; i++) {
        o = board[i];
        if (!o || o.status === 'pulada') { continue; }
        dados.atividades.push({
          id: (o.act && o.act.id) || null,
          titulo: o.titulo || (o.act && o.act.titulo) || '',
          donoUid: o.uid || (o.act && o.act.responsavelUid) || '',
          responsavelNome: o.responsavel || (o.act && o.act.responsavelNome) || '',
          setorSigla: (o.act && o.act.setorSigla) || '',
          dtPrevista: o.effDate || null,
          status: o.status === 'concluida' ? 'feita' : 'aberta',
          statusReal: o.status || 'pendente',
          prioridade: (o.act && o.act.prioridade) || null,
          bloqueiaOutros: 0,
          semMovimento: false,
          horario: (o.act && o.act.horario) || null
        });
      }
      var pp = null;
      if (window.KPI && typeof window.KPI.computarPorPessoa === 'function') {
        try { pp = window.KPI.computarPorPessoa(ctx); } catch (e) { pp = null; }
      }
      var pess = (pp && pp.pessoas) || [];
      for (i = 0; i < pess.length; i++) {
        var p = pess[i];
        dados.pessoas.push({
          uid: p.uid, nome: p.nome, setorSigla: (p.setores && p.setores[0]) || '',
          atrasadas: p.atrasadas || 0, paradas: 0, bloqueiam: 0, diasSemAtualizar: 0,
          feitasNoPrazo: p.noPrazo || 0, feitasAdiantadas: 0, presencas: 0, planosEmDia: 0,
          ativas: p.carga || 0, atividadesNoPeriodo: p.previstas || 0
        });
      }
      dados.hoje = hoje;
      dados.user = user || null;
      return dados;
    },

    /* Variante síncrona com dados mock (para testes/desenvolvimento) */
    loadFromMock: function (firebaseMock, uid, setorSigla) {
      /* Usa firebase-mock.js como fonte */
      if (!firebaseMock || !firebaseMock.atividades) {
        return { atividades: [], usuarios: [], pessoas: [], reunioes: [], planos: [] };
      }
      return {
        atividades: firebaseMock.atividades || [],
        usuarios: firebaseMock.usuarios || [],
        pessoas: firebaseMock.pessoas || [],
        reunioes: firebaseMock.reunioes || [],
        planos: firebaseMock.planos || []
      };
    }
  };

})();
