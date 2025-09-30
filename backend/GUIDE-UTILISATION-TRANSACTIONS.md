# 📘 Guide d'Utilisation des Transactions

## 🎯 Pourquoi utiliser des transactions ?

Les transactions garantissent l'**intégrité des données** en s'assurant que plusieurs opérations SQL sont exécutées de manière atomique :
- ✅ Soit **toutes** les opérations réussissent (COMMIT)
- ✅ Soit **aucune** n'est appliquée (ROLLBACK)

---

## 📦 Fonctions disponibles

### 1. `withTransaction(callback)`

Exécute une fonction dans une transaction SQL.

**Exemple simple** :
```typescript
import { withTransaction } from '../utils/transaction';

const result = await withTransaction(async (client) => {
  // Toutes ces requêtes sont dans la même transaction
  await client.query('UPDATE sales SET statut = $1 WHERE id = $2', ['termine', saleId]);
  await client.query('UPDATE payment_plans SET statut = $1 WHERE sale_id = $2', ['paye', saleId]);
  
  return { success: true };
});
```

**Exemple avec gestion d'erreur** :
```typescript
try {
  const result = await withTransaction(async (client) => {
    // Si une erreur se produit ici, tout sera annulé
    await client.query('UPDATE sales ...');
    await client.query('UPDATE payment_plans ...');
    
    // Vérification métier
    if (someCondition) {
      throw new Error('Condition métier non respectée');
    }
    
    return { success: true };
  });
} catch (error) {
  // La transaction a été annulée automatiquement
  logger.error('Transaction failed', { error });
  throw error;
}
```

---

### 2. `executeQuery(client, text, params)`

Exécute une requête SQL avec logging automatique.

**Exemple** :
```typescript
import { executeQuery } from '../utils/transaction';

const result = await executeQuery(
  client,
  'SELECT * FROM sales WHERE id = $1',
  [saleId]
);
```

---

### 3. `batchTransaction(queries)`

Exécute plusieurs requêtes dans une transaction.

**Exemple** :
```typescript
import { batchTransaction } from '../utils/transaction';

const results = await batchTransaction([
  { text: 'UPDATE sales SET statut = $1 WHERE id = $2', params: ['termine', saleId] },
  { text: 'UPDATE payment_plans SET statut = $1 WHERE sale_id = $2', params: ['paye', saleId] },
  { text: 'INSERT INTO history (sale_id, action) VALUES ($1, $2)', params: [saleId, 'completed'] },
]);
```

---

### 4. `resourceExists(client, table, id)`

Vérifie si une ressource existe.

**Exemple** :
```typescript
import { resourceExists } from '../utils/transaction';

const exists = await resourceExists(pool, 'projects', projectId);
if (!exists) {
  throw createError('Projet non trouvé', 404);
}
```

---

### 5. `userHasAccess(client, table, resourceId, userId)`

Vérifie qu'un utilisateur a accès à une ressource.

**Exemple** :
```typescript
import { userHasAccess } from '../utils/transaction';

const hasAccess = await userHasAccess(pool, 'sales', saleId, req.user.userId);
if (!hasAccess) {
  throw createError('Accès non autorisé', 403);
}
```

---

## 🔧 Exemples d'utilisation dans les routes

### Exemple 1 : Modification d'un paiement (avec transaction)

**AVANT (sans transaction)** ❌ :
```typescript
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  // Problème : Si la 2ème requête échoue, la 1ère est déjà faite !
  await query('UPDATE payment_plans SET montant_paye = $1 WHERE id = $2', [montant, id]);
  await query('UPDATE sales SET avance_total = $1 WHERE id = $2', [newTotal, saleId]);
  
  res.json({ success: true });
}));
```

**APRÈS (avec transaction)** ✅ :
```typescript
import { withTransaction, executeQuery } from '../utils/transaction';

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await withTransaction(async (client) => {
    // Si une erreur se produit, TOUT sera annulé
    await executeQuery(
      client,
      'UPDATE payment_plans SET montant_paye = $1 WHERE id = $2',
      [montant, id]
    );
    
    await executeQuery(
      client,
      'UPDATE sales SET avance_total = $1 WHERE id = $2',
      [newTotal, saleId]
    );
    
    return { success: true };
  });
  
  res.json(result);
}));
```

---

### Exemple 2 : Création d'une vente avec paiements

```typescript
import { withTransaction, executeQuery, resourceExists } from '../utils/transaction';

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { project_id, client_nom, prix_total, payment_plans } = req.body;
  
  const result = await withTransaction(async (client) => {
    // 1. Vérifier que le projet existe
    const projectExists = await resourceExists(client, 'projects', project_id);
    if (!projectExists) {
      throw createError('Projet non trouvé', 404);
    }
    
    // 2. Créer la vente
    const saleResult = await executeQuery(
      client,
      `INSERT INTO sales (project_id, client_nom, prix_total, user_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [project_id, client_nom, prix_total, req.user.userId]
    );
    const sale = saleResult.rows[0];
    
    // 3. Créer les plans de paiement
    for (const plan of payment_plans) {
      await executeQuery(
        client,
        `INSERT INTO payment_plans (sale_id, numero_echeance, montant_prevu) 
         VALUES ($1, $2, $3)`,
        [sale.id, plan.numero, plan.montant]
      );
    }
    
    return { sale, message: 'Vente créée avec succès' };
  });
  
  res.status(201).json({ success: true, data: result });
}));
```

---

### Exemple 3 : Suppression en cascade

```typescript
import { withTransaction, executeQuery, userHasAccess } from '../utils/transaction';

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await withTransaction(async (client) => {
    // 1. Vérifier l'accès
    const hasAccess = await userHasAccess(client, 'sales', id, req.user.userId);
    if (!hasAccess) {
      throw createError('Accès non autorisé', 403);
    }
    
    // 2. Supprimer les paiements associés
    await executeQuery(
      client,
      'DELETE FROM payment_plans WHERE sale_id = $1',
      [id]
    );
    
    // 3. Supprimer les chèques associés
    await executeQuery(
      client,
      'DELETE FROM checks WHERE sale_id = $1',
      [id]
    );
    
    // 4. Supprimer la vente
    await executeQuery(
      client,
      'DELETE FROM sales WHERE id = $1',
      [id]
    );
  });
  
  res.json({ success: true, message: 'Vente supprimée' });
}));
```

---

## 🎯 Quand utiliser les transactions ?

### ✅ **TOUJOURS utiliser** pour :
- Modifications de plusieurs tables liées
- Opérations financières (paiements, ventes)
- Suppressions en cascade
- Mises à jour qui doivent être cohérentes

### ⚠️ **PAS NÉCESSAIRE** pour :
- Lecture simple (SELECT)
- Insertion/modification d'une seule ligne
- Opérations indépendantes

---

## 📊 Logging automatique

Toutes les requêtes sont automatiquement loggées avec :
- ✅ Durée d'exécution
- ✅ Nombre de lignes affectées
- ✅ Détection des requêtes lentes (> 1s)
- ✅ Logs d'erreur détaillés

**Exemple de log** :
```
[2025-09-30 14:30:45] [debug]: Query executed { query: 'UPDATE sales SET...', duration: '45ms', rows: 1 }
[2025-09-30 14:30:46] [warn]: Slow query detected { query: 'SELECT * FROM...', duration: '1250ms', rows: 100 }
```

---

## 🚀 Prochaines étapes

1. **Migrer les routes existantes** pour utiliser les transactions
2. **Ajouter des tests** pour vérifier le rollback
3. **Monitorer les performances** avec les logs

---

**Besoin d'aide ?** Consultez les tests dans `tests/utils/transaction.test.ts` pour plus d'exemples !

