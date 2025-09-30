# 🧪 Tests Backend

## 📁 Structure des tests

```
tests/
├── utils/                    # Tests unitaires des utilitaires
│   ├── auth.test.ts         # Tests d'authentification
│   ├── validation.test.ts   # Tests de validation
│   └── transaction.test.ts  # Tests de transactions
├── integration/             # Tests d'intégration
│   └── auth.integration.test.ts  # Tests API d'authentification
└── README.md
```

---

## 🚀 Commandes disponibles

### Exécuter tous les tests
```bash
npm test
```

### Exécuter les tests en mode watch (développement)
```bash
npm run test:watch
```

### Exécuter les tests avec couverture de code
```bash
npm run test:coverage
```

### Exécuter uniquement les tests unitaires
```bash
npm run test:unit
```

### Exécuter uniquement les tests d'intégration
```bash
npm run test:integration
```

---

## 📊 Couverture de code

L'objectif est d'atteindre **70% de couverture** minimum pour :
- ✅ Branches
- ✅ Fonctions
- ✅ Lignes
- ✅ Statements

**Vérifier la couverture** :
```bash
npm run test:coverage
```

Le rapport sera généré dans `coverage/` et affiché dans le terminal.

---

## 🧪 Types de tests

### 1. Tests Unitaires (`tests/utils/`)

Testent des **fonctions isolées** sans dépendances externes.

**Exemple** :
```typescript
describe('hashPassword', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });
});
```

---

### 2. Tests d'Intégration (`tests/integration/`)

Testent des **endpoints API complets** avec la base de données.

**Exemple** :
```typescript
describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', nom: 'Test' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

---

## 🔧 Configuration

### Jest (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

---

## 📝 Bonnes pratiques

### 1. Nommage des tests

```typescript
// ✅ BON
describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => { ... });
    it('should generate different hashes for the same password', async () => { ... });
  });
});

// ❌ MAUVAIS
describe('test', () => {
  it('works', () => { ... });
});
```

---

### 2. Arrange-Act-Assert (AAA)

```typescript
it('should validate correct login data', () => {
  // Arrange (Préparer)
  const validData = {
    email: 'test@example.com',
    password: 'password123',
  };
  
  // Act (Agir)
  const result = validate(loginSchema, validData);
  
  // Assert (Vérifier)
  expect(result).toEqual(validData);
});
```

---

### 3. Nettoyer après les tests

```typescript
describe('Auth API', () => {
  // Nettoyer avant chaque test
  beforeEach(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  // Fermer les connexions après tous les tests
  afterAll(async () => {
    await pool.end();
  });
});
```

---

### 4. Tester les cas d'erreur

```typescript
describe('loginSchema', () => {
  it('should validate correct data', () => {
    // Test du cas nominal
    const validData = { email: 'test@example.com', password: 'password123' };
    expect(validate(loginSchema, validData)).toEqual(validData);
  });

  it('should reject invalid email', () => {
    // Test du cas d'erreur
    const invalidData = { email: 'invalid-email', password: 'password123' };
    expect(() => validate(loginSchema, invalidData)).toThrow();
  });
});
```

---

## 🎯 Objectifs de couverture par module

| Module | Couverture cible | Priorité |
|--------|------------------|----------|
| `utils/auth.ts` | 90% | 🔴 Haute |
| `utils/validation.ts` | 90% | 🔴 Haute |
| `utils/transaction.ts` | 85% | 🔴 Haute |
| `routes/auth.ts` | 80% | 🟡 Moyenne |
| `routes/sales.ts` | 75% | 🟡 Moyenne |
| `routes/projects.ts` | 75% | 🟡 Moyenne |
| `middleware/auth.ts` | 85% | 🔴 Haute |
| `middleware/errorHandler.ts` | 80% | 🟡 Moyenne |

---

## 🐛 Debugging des tests

### Exécuter un seul fichier de test
```bash
npm test -- auth.test.ts
```

### Exécuter un seul test
```typescript
it.only('should hash a password', async () => {
  // Ce test sera le seul à s'exécuter
});
```

### Ignorer un test temporairement
```typescript
it.skip('should do something', () => {
  // Ce test sera ignoré
});
```

### Voir les logs pendant les tests
```bash
npm test -- --verbose
```

---

## 📈 Progression actuelle

### Tests créés ✅
- ✅ `tests/utils/auth.test.ts` - Tests d'authentification
- ✅ `tests/utils/validation.test.ts` - Tests de validation
- ✅ `tests/utils/transaction.test.ts` - Tests de transactions
- ✅ `tests/integration/auth.integration.test.ts` - Tests API auth

### Tests à créer 📝
- ⏳ `tests/integration/sales.integration.test.ts` - Tests API ventes
- ⏳ `tests/integration/projects.integration.test.ts` - Tests API projets
- ⏳ `tests/middleware/auth.test.ts` - Tests middleware auth
- ⏳ `tests/middleware/errorHandler.test.ts` - Tests gestion erreurs

---

## 🚀 Prochaines étapes

1. **Exécuter les tests** :
   ```bash
   npm test
   ```

2. **Vérifier la couverture** :
   ```bash
   npm run test:coverage
   ```

3. **Ajouter plus de tests** pour atteindre 70% de couverture

4. **Intégrer dans CI/CD** (GitHub Actions, GitLab CI, etc.)

---

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Besoin d'aide ?** Consultez les exemples dans les fichiers de test existants !

