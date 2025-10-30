# Modélisation des flux (Application Flow)

Le flux entre Frontend —> Backend/API —> Hyperviseur (virsh/terraform) —> Base.

## Vue d'ensemble
- Frontend (React SPA)
  - Actions utilisateur (list VMs, créer VM, admin actions)
  - Appelle l'API REST (/api/...)

- Backend (Express)
  - Routes publiques : /api/auth, /api/vms, /api/admin
  - Contrôleurs : valident, autorisent, enregistrent en base, et pour les opérations lourdes -> synchrone (pour le moment)
  - Middleware d'erreurs global et format de réponse standardisé

- Hyperviseur / Services (virsh, terraform)
  - Exécution réelle des commandes
