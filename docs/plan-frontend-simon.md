# Plan d'action — Initialisation du frontend (pour Simon, en autonomie)

## Décision prise

**React + Vite**, pas Next.js. Raison : le SEO ne joue un rôle que sur la carte publique, le reste de l'app est un espace applicatif derrière connexion où le SSR n'apporte rien. Vite est plus simple et plus rapide en dev, cohérent avec le principe "pas de complexité non justifiée" déjà appliqué côté backend (choix de Prisma, hébergement managé).

## Prérequis

Même environnement que le backend : Node 22 (déjà installé), le dépôt cloné et à jour (`git pull` depuis `~/projets/accroche`).

## Étapes

### 1. Créer une branche dédiée

Ne pas travailler directement sur `master` (règle posée en fin de dernière session) :

```bash
cd ~/projets/accroche
git checkout -b feature/init-frontend
```

### 2. Initialiser le projet Vite dans le dossier `frontend/` existant

```bash
cd frontend
npm create vite@latest . -- --template react-ts
```

Le `.` initialise dans le dossier courant (`frontend/`, déjà présent dans le repo) plutôt que d'en créer un nouveau. Le template `react-ts` inclut TypeScript — cohérent avec le backend, et avec le principe de typage fort posé dès la conception.

Si le dossier n'est pas vide (il peut contenir un `.gitkeep` ou rien), Vite peut demander confirmation — accepter.

### 3. Installer les dépendances et vérifier que ça tourne

```bash
npm install
npm run dev
```

Ça doit démarrer un serveur de dev, typiquement sur `http://localhost:5173`. Ouvrir cette URL dans le navigateur pour confirmer que la page par défaut de Vite/React s'affiche.

### 4. Nettoyer le boilerplate par défaut

Vite génère un exemple avec un compteur de clics — à vider avant de commencer le vrai travail, pour ne pas confondre plus tard ce qui est "à nous" de ce qui est généré. Remplacer le contenu de `src/App.tsx` par un composant minimal :

```tsx
function App() {
  return <div>Accroche — frontend en construction</div>;
}

export default App;
```

### 5. Premier appel réel à l'API backend — vérifier la connexion bout en bout

Avant de construire le moindre écran, valider que le frontend peut parler au backend. Backend doit tourner en parallèle (`cd ../backend && npm run start:dev` dans un autre terminal).

Dans `src/App.tsx`, un test minimal :

```tsx
import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('en attente...');

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/musicians/id-test/matches')
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((err) => setStatus('Erreur: ' + err.message));
  }, []);

  return (
    <div>
      <p>Accroche — frontend en construction</p>
      <p>Réponse API : {status}</p>
    </div>
  );
}

export default App;
```

Si tout fonctionne, la page doit afficher `{"data":[],"meta":{...}}` — la preuve que frontend et backend communiquent réellement, avant d'investir dans le moindre écran.

**Point d'attention prévisible : CORS.** Le backend n'autorise probablement pas encore les requêtes venant d'une origine différente (`localhost:5173` vers `localhost:3000`). Si une erreur CORS apparaît dans la console du navigateur, ce n'est pas un bug frontend — il faudra activer CORS côté NestJS (`app.enableCors()` dans `main.ts`). Ne pas chercher la solution côté frontend si ça arrive, signaler ce point précis pour qu'on le traite ensemble.

### 6. Commit et Pull Request

Une fois les étapes 1 à 5 validées :

```bash
cd ~/projets/accroche
git add -A
git commit -m "Init frontend: React + Vite + TypeScript, premier appel API validé"
git push -u origin feature/init-frontend
```

Puis ouvrir une Pull Request sur GitHub vers `master` (via l'interface web, ou `gh pr create` depuis le terminal) pour que Logan puisse relire avant de merger.

## Ce qui n'est volontairement pas traité dans cette tâche

- Aucun écran réel (carte, formulaire, liste de matchs) — juste la preuve de connexion.
- Aucune librairie de carte (Leaflet/Mapbox) — décision à prendre ensemble, pas seul, car elle engage plusieurs écrans.
- Aucune gestion d'état globale (Redux, Zustand, etc.) — prématuré avant d'avoir un vrai écran à construire.
