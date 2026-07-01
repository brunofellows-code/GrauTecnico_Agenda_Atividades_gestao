/* ============================================================
   firebase.js · Sistema A — Grau Técnico FSA
   ------------------------------------------------------------
   Inicializa o Firebase (SDK 12.15.0 via CDN ESM) e exporta
   auth + db para o resto do sistema.

   CARREGAR SEMPRE COMO MÓDULO:
     <script type="module" src="firebase.js"></script>
   e importar com:
     import { auth, db } from "./firebase.js";

   Observação: a apiKey do Firebase é PÚBLICA por design (vai no
   cliente). O que protege os dados são as Regras do Firestore,
   não esconder a chave.
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBn_TQmjq2JfgR4-PpB59178_DtKJTUFfc",
  authDomain: "agenda-gestao-grau-tecnico.firebaseapp.com",
  projectId: "agenda-gestao-grau-tecnico",
  storageBucket: "agenda-gestao-grau-tecnico.firebasestorage.app",
  messagingSenderId: "1088454830872",
  appId: "1:1088454830872:web:d7fc603beb3a1172640c6d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* Mantém o usuário logado entre sessões/abas. Se o navegador
   bloquear o armazenamento (modo privado restrito), cai no
   padrão em memória sem quebrar o login. */
setPersistence(auth, browserLocalPersistence).catch(function () { /* fallback silencioso */ });

export { app, auth, db };
