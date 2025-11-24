# Explications données Grafana

## Débit HTTP Global

Nombre de requêtes HTTP reçues par seconde.

## Latence HTTP p95/p50

P95 = 95 % des requêtes prennent x ms ou moins.

P50 = 50 % des requêtes prennent x ms ou moins (médiane).

À noter :

- < 50 ms = excellent
- 50-150 ms = normal
- 300 ms = à surveiller
- 1 s = problématique

## Utilisation CPU processus

Utilisation du CPU en pourcentage.

## Mémoire processus

RSS = Resident Set Size : mémoire totale allouée au processus Node.
Heap = mémoire JavaScript réellement utilisée.

| Partie | Valeur normale |
| ------ | -------------- |
| Heap   | 50-150MiB      |
| RSS    | 120-250MiB     |

### Problème possible

Si Heap > 200 MiB = surcharge.
Si Heap > 300 MiB = suspicion de fuite mémoire.
Si Heap > 500-700 MiB = risque de crash.

Si RSS > 300-400 MiB = à surveiller.
Si RSS > 600-800 MiB = anormal.
Si RSS > 1 Go = critique.

## Lag event-loop Node.js

Temps nécessaire pour qu’un cycle complet de la boucle Node.js s’exécute.

- < 20 ms = parfait
- 20-50 ms = normal
- 100 ms = surcharge CPU
- 500 ms = API gelée

## Débit par code HTTP

Affiche le **débit (req/s)** pour chaque code HTTP (200, 401, 500, …).  
Une valeur de `0.7` par exemple signifie “0,7 requête/seconde répondent avec ce code”, pas que le code vaut 0.7.  
Une hausse des courbes 4xx/5xx indique un problème applicatif ou client.

## Compteur de réponses HTTP (période)

Tableau qui montre le **nombre brut** de réponses rendues par classe HTTP (2xx, 4xx, 5xx…).  
Basé sur `sum by (classe) (label_replace(increase(http_request_duration_seconds_count[$__range]), "classe", "$1xx", "status", "([1-5])\\d\\d"))`.  
Permet de vérifier rapidement la répartition 2xx/4xx/5xx sur la période, même si les codes individuels restent trop faibles pour être visibles sur le graphe de débit.
