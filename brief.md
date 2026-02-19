Réaliser une application web React + Express + Socket.IO permettant de rejoindre des rooms avec un pseudo et discuter en temps réel, sans base de données.
Le projet met l’accent sur : architecture, intégration CSS avancée (Grid/order), industrialisation (Docker + Render dès J1), documentation (Swagger + docs), qualité (CI ESLint), sécurité light (helmet + rate limit).

Contexte du projet

Vous travaillez dans une startup événementielle qui veut tester une V1 “concept”.

Le CTO impose une démarche “prod-ready” dès le départ :

    Déploiement Render dès J1
    Conteneurisation (2 services)
    Documentation et conventions
    UI sobre mais asymétrique (wireframe fournie par le produit)

Wireframe à intégrer (structure) : le wireframe fournie sert de référence de composition (asymétrie, superpositions, hiérarchie, blocs décalés).

**Objectif** : reproduire la structure/layout.
Modalités pédagogiques
Modalités pédagogiques (pédagogie active obligatoire)

Le cadre est imposé, mais l’exécution se fait en intelligence collective :

    Rituels quotidiens (15 min) : “Ce que j’ai structuré / ce qui bloque / mon choix du jour / pourquoi”

Moments de revue collective (au moins 2) centrés sur :

    architecture repo / scripts
    qualité SCSS/BEM
    stratégie Grid/Order/Superposition
    Docker + Render
    Mutualisation de veille : partage de sources, mais rédaction individuelle du VEILLE.md
    Itération obligatoire : après feedback, chaque apprenant améliore sa structure

Interdit
: copier-coller de solution complète.
Attendu : comprendre, justifier, documenter.
Modalités d'évaluation
Évaluation individuelle, basée sur des preuves observables :

- Revue du repo (structure, conventions, scripts, CI)
- Démonstration fonctionnelle (rooms + chat temps réel)
- Vérification déploiement Render
- Vérification docs (Swagger + events)
- Lecture de VEILLE.md (posture “POURQUOI ?”)
- Soutenance courte : décisions d’architecture + limites + plan V2