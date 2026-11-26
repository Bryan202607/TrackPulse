# Sécurité
- Ne jamais commiter `.env` (déjà dans `.gitignore`). Les clés Firebase web ne sont pas secrètes : ce sont les règles `firestore.rules` qui protègent les données.
- Republier `firestore.rules` à chaque modification, et activer Firebase App Check.
- Signaler une faille en privé au responsable du dépôt (pas dans une issue publique).
