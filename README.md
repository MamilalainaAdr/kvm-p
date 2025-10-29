# KVM Platform — Nouvelle structure (Frontend + Backend)

But : seul la base de données est dockerisée (docker-compose.yml fourni).
Le projet est séparé en deux dossiers : `backend/` (API REST Node/Express + Sequelize) et `frontend/` (React + Vite + Tailwind).

Ce repository fournit une structure minimale et fonctionnelle pour :
- Auth (inscription, vérification email, connexion/déconnexion) avec JWT stocké en cookie httpOnly.
- Gestion des VMs via endpoints REST (création / listing / suppression) qui appellent les services Terraform / Virsh.
- Services email, terraform et virsh isolés dans `backend/src/services`.
- Frontend SPA (React) qui consomme l'API (envoi de cookies httpOnly).


### Démarrage rapide

1) Lancer la base de données (Docker)
   ```bash
   docker-compose up -d
   ```
2) Backend
   ```bash
   cd backend
   cp .env.example .env     # remplir les valeurs
   npm install
   npm run dev
   ```
   Le backend écoute par défaut sur : http://localhost:4000

   Vérifier : GET http://localhost:4000/api/health

3) Frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Le frontend écoute par défaut sur : http://localhost:5173

### Notes d'architecture et décisions clés
- JWT + cookie httpOnly : adapté à une SPA + API REST. Pas de session server-side
- Sequelize : unique ORM pour la BD (models dans backend/src/models).
- API prefix : `/api/*` (évite la duplication routes/pages).
- Opérations longues (terraform apply/destroy) sont synchrones dans les services pour commencer ; à moyen terme il est recommandé d'introduire une file d'attente (Redis + Bull) si on attend beaucoup d'opérations simultanées.