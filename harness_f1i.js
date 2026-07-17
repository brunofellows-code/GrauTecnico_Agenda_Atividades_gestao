/* ============================================================
   harness_f1i.js · Sessão F1-I — validação à mão (Node, zero rede)
   Cobre: KPI.streak80 (regra 80% + auto-perdão de dia vazio +
   hoje aberto não quebra) e KPI.escalonamentoPlano (D-5/D-3/D-0,
   nunca bloqueia). Rodar: node harness_f1i.js
   ============================================================ */
'use strict';
global.window = global;
window.GrautRecorrencia = {
  hojeISO: function () { return '2026-07-16'; },
  toISO: function (d) { function z(n){return (n<10?'0':'')+n;} return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()); },
  fromISO: function (iso) { var p=iso.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); },
  compareISO: function (a,b) { return a<b?-1:a>b?1:0; },
  diasEntre: function (a,b) { var A=window.GrautRecorrencia.fromISO(a),B=window.GrautRecorrencia.fromISO(b); return Math.round((B-A)/86400000); },
  addDias: function (iso,n) { var d=window.GrautRecorrencia.fromISO(iso); d.setDate(d.getDate()+n); return window.GrautRecorrencia.toISO(d); },
  isISO: function (s) { return /^\d{4}-\d{2}-\d{2}$/.test(s||''); },
  ocorrenciasNaJanela: function(){return [];}, validar: function(){return [];}
};
require('./kpi.js');
var K = window.KPI;
var PASS=0,FAIL=0;
function ok(c,m){ if(c){PASS++;console.log('PASS '+m);} else {FAIL++;console.log('FAIL '+m);} }

var H='2026-07-16', ME='u1';
function oc(date,status,uid){ return { effDate:date, status:status, act:{ responsavelUid: uid||ME } }; }

/* 1) streak básico: 14,15 fechados 100%; hoje 2/2 → 3 dias */
var b1=[oc('2026-07-14','concluida'),oc('2026-07-15','concluida'),
        oc('2026-07-16','concluida'),oc('2026-07-16','concluida')];
var s=K.streak80(b1,ME,H);
ok(s.dias===3 && s.hojeFechado===true,'3 dias seguidos, hoje fechado (dias='+s.dias+')');

/* 2) hoje ABERTO (0/1) não quebra: ontem+anteontem fechados → 2 */
var b2=[oc('2026-07-14','concluida'),oc('2026-07-15','concluida'),oc('2026-07-16','pendente')];
s=K.streak80(b2,ME,H);
ok(s.dias===2 && s.hojeFechado===false,'hoje aberto não quebra; conta de ontem (dias='+s.dias+')');

/* 3) regra 80%: dia 15 com 4/5 = 80% CONTA; dia 14 com 3/5 = 60% QUEBRA */
var b3=[];
for(var i=0;i<5;i++){ b3.push(oc('2026-07-15', i<4?'concluida':'pendente')); }
for(i=0;i<5;i++){ b3.push(oc('2026-07-14', i<3?'concluida':'pendente')); }
s=K.streak80(b3,ME,H);
ok(s.dias===1,'80% conta (15/07 4/5), 60% quebra (14/07 3/5) → dias='+s.dias);

/* 4) auto-perdão: 13 fechado, 14-15 SEM nada previsto, hoje fechado → 2 */
var b4=[oc('2026-07-13','concluida'),oc('2026-07-16','concluida')];
s=K.streak80(b4,ME,H);
ok(s.dias===2,'dia sem previstas não quebra (13/07 + hoje = '+s.dias+')');

/* 5) pulada não conta como prevista (dia só com pulada = dia vazio) */
var b5=[oc('2026-07-15','pulada'),oc('2026-07-14','concluida'),oc('2026-07-16','concluida')];
s=K.streak80(b5,ME,H);
ok(s.dias===2,'pulada = dia vazio; 14/07 + hoje = '+s.dias);

/* 6) ocorrência de OUTRO uid não entra */
var b6=[oc('2026-07-16','concluida','OUTRO')];
s=K.streak80(b6,ME,H);
ok(s.dias===0 && s.hojePrev===0,'board de outro uid → zero');

/* 7) futuro não entra */
s=K.streak80([oc('2026-07-20','concluida')],ME,H);
ok(s.dias===0,'effDate futura ignorada');

/* ---------- escalonamentoPlano ---------- */
function pl(prazo){ return { prazo: prazo }; }
var e;
e=K.escalonamentoPlano(pl('2026-07-30'),20,H);
ok(e===null,'faltam 14d → null (cedo demais)');
e=K.escalonamentoPlano(pl('2026-07-21'),50,H);              /* faltam 5 */
ok(e && e.nivel==='D5' && e.quem==='dono','faltam 5 + 50% → D5 dono');
e=K.escalonamentoPlano(pl('2026-07-19'),50,H);              /* faltam 3 */
ok(e && e.nivel==='D3' && e.quem==='gestao','faltam 3 + 50% → D3 gestão');
e=K.escalonamentoPlano(pl('2026-07-15'),50,H);              /* venceu */
ok(e && e.nivel==='D0' && e.quem==='nc','vencido → D0 não-conformidade');
e=K.escalonamentoPlano(pl('2026-07-21'),85,H);
ok(e===null,'faltam 5 mas 85% ≥ 70% → null (no ritmo)');
e=K.escalonamentoPlano(pl('2026-07-15'),100,H);
ok(e===null,'100% entregue → null mesmo vencido');
e=K.escalonamentoPlano(pl('2026-07-19'),null,H);
ok(e && e.nivel==='D3','pct null (coletando) tratado como 0 → escala');
e=K.escalonamentoPlano({prazo:''},10,H);
ok(e===null,'sem prazo válido → null (nunca inventa)');

console.log('\n'+PASS+' PASS · '+FAIL+' FAIL');
if(FAIL){process.exit(1);}
console.log('== HARNESS F1-I: 100% VALIDADO À MÃO ==');
