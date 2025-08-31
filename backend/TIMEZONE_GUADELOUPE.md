# Configuration Timezone Guadeloupe

## Modifications effectuées

### 1. Schéma de base de données (Prisma)

- **Fichier** : `prisma/schema.prisma`
- **Changement** : Timezone par défaut modifiée de `"Europe/Paris"` à `"America/Guadeloupe"`
- **Ligne 47** : `timezone String @default("America/Guadeloupe")`

### 2. Service des rendez-vous

- **Fichier** : `src/appointments/appointments.service.ts`
- **Ajout** : Fonction utilitaire `toGuadeloupeTime()` pour convertir les dates
- **Méthodes modifiées** :
  - `confirm()` : Conversion automatique en timezone Guadeloupe
  - `updateStatusAdmin()` : Gestion de la timezone lors des mises à jour
  - `rescheduleAdmin()` : Conversion lors des reprogrammations

### 3. Fonction utilitaire ajoutée

```typescript
function toGuadeloupeTime(date: Date | string): Date {
  const dateObj = new Date(date);
  return new Date(
    dateObj.toLocaleString('en-US', {
      timeZone: 'America/Guadeloupe',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );
}
```

## Impact

### Nouveaux rendez-vous

- Toutes les nouvelles confirmations utilisent la timezone Guadeloupe
- Le champ `timezone` est automatiquement défini à `"America/Guadeloupe"`
- Les rappels sont calculés selon la timezone Guadeloupe

### Rendez-vous existants

- Les rendez-vous existants conservent leur timezone d'origine
- Seules les modifications utilisent la nouvelle timezone

## Timezone Guadeloupe

- **Identifiant IANA** : `America/Guadeloupe`
- **Décalage UTC** : UTC-4 (heure normale) / UTC-3 (heure d'été)
- **Gestion automatique** : L'heure d'été est gérée automatiquement

## Migration

La migration `20250831013050_update_timezone_to_guadeloupe` a été appliquée pour mettre à jour le schéma de base de données.

## Tests recommandés

1. Créer un nouveau rendez-vous et vérifier la timezone
2. Reprogrammer un rendez-vous existant
3. Mettre à jour le statut d'un rendez-vous avec une nouvelle date
4. Vérifier que les rappels sont envoyés au bon moment
