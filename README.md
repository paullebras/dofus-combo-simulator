# dofus-combo-simulator

Outil open source de theorycraft Dofus permettant de comparer les degats moyens de differents stuffs et combos de sorts.

## POC actuel

Le projet cible d'abord un calculateur deterministe pour les sorts Iop niveau 200.

- Les donnees de sorts viennent de DofusDB.
- Les stats du lanceur sont saisies manuellement.
- La cible est un dummy nu avec 0 resistance.
- Le resultat principal est le degat espere par sort et par PA.

## Attribution DofusDB

Donnees issues de DofusDB. Utilisation soumise a la LPNC-IA 1.0.

Les appels API envoyent egalement le header `Referer: dofus-combo-simulator`, conformement a la demande du createur de l'API.

## Scripts

```bash
npm run dev
npm run dev:stuff
npm run dev:compare:basic
npm run dev:watch
npm run dev:watch:stuff
npm run dev:watch:compare:basic
npm run typecheck
npm run build
npm start
```

- `dev`: lance le calculateur avec les stats nues niveau 200.
- `dev:stuff`: lance le calculateur avec le stuff DofusDB de test.
- `dev:compare:basic`: compare les deux stuffs de test sur `basic combo #1`.
- `dev:watch`: relance automatiquement le calculateur en cas de modification.
- `dev:watch:stuff`: relance automatiquement le calculateur avec le stuff de test.
- `dev:watch:compare:basic`: relance automatiquement la comparaison du combo de test.
- `typecheck`: verifie les types TypeScript sans generer de fichiers.
- `build`: compile le projet dans `dist`.
- `start`: lance la version compilee.

## Exemples

### Lancer le calculateur avec les stats nues

```bash
npm run dev
```

### Lancer le calculateur avec un stuff DofusDB

Stuff de test actuel :

```text
69f6a4074304cd0013621863
```

Commande courte :

```bash
npm run dev:stuff
```

Commande avec un autre stuff :

```bash
npm run dev -- --stuff <stuffId>
```

Exemple :

```bash
npm run dev -- --stuff 69f6a4074304cd0013621863
```

### Comparer deux stuffs sur le combo de base

Combo actuel :

```text
basic-combo-1
```

Stuffs de comparaison actuels :

```text
Iop Terre basique: 69f6a4074304cd0013621863
Iop Terre crit:    69f6aad50e790800141dfb88
```

Commande courte :

```bash
npm run dev:compare:basic
```

Commande avec d'autres stuffs :

```bash
npm run dev -- --combo basic-combo-1 --compare-stuffs <stuffIdA>,<stuffIdB>
```

Exemple :

```bash
npm run dev -- --combo basic-combo-1 --compare-stuffs 69f6a4074304cd0013621863,69f6aad50e790800141dfb88
```

### Mode watch

Relancer automatiquement la comparaison du combo de base :

```bash
npm run dev:watch:compare:basic
```

Relancer automatiquement le calculateur avec le stuff de test :

```bash
npm run dev:watch:stuff
```

## Structure

- `src/domain`: types metier purs.
- `src/dofusdb`: client API et normalisation des donnees DofusDB.
- `src/calculator`: formules de degats.
- `src/main.ts`: point d'entree POC avec des stats d'exemple.
