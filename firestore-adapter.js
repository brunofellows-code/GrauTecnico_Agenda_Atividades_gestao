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

  if (!window.firebase || !window.SCORES) {
    console.warn('firestore-adapter.js: Dependências faltam (firebase.js, scores.js)');
    return;
  }

  window.ADAPTER = {
    /* Cache local para reduzir leituras */
    _cache: {},

    /* Carregar dados do Firestore real */
    loadFromFirebase: function (uid, setorSigla, callback) {
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
            status: a.status || 'aberta',
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
                var usuario = dados.usuarios.find(function (u) { return u.uid === uidPes; });
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
