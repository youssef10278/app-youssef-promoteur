/**
 * Utilitaires pour transformer les données de la base de données
 */

/**
 * Convertit les champs numériques d'un objet de string vers number
 */
export function parseNumericFields<T extends Record<string, any>>(
  obj: T,
  numericFields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of numericFields) {
    if (result[field] !== null && result[field] !== undefined) {
      const value = result[field];
      if (typeof value === 'string') {
        result[field] = parseFloat(value) as any;
      }
    }
  }
  
  return result;
}

/**
 * Convertit les champs numériques d'un tableau d'objets
 */
export function parseNumericFieldsArray<T extends Record<string, any>>(
  arr: T[],
  numericFields: (keyof T)[]
): T[] {
  return arr.map(obj => parseNumericFields(obj, numericFields));
}

/**
 * Convertit un projet avec ses champs numériques
 */
export function parseProject(project: any) {
  return parseNumericFields(project, [
    'surface_totale',
    'nombre_lots',
    'nombre_appartements',
    'nombre_garages'
  ]);
}

/**
 * Convertit une vente avec ses champs numériques
 */
export function parseSale(sale: any) {
  return parseNumericFields(sale, [
    'surface',
    'prix_total',
    'avance_declare',
    'avance_non_declare',
    'avance_total',
    'reste_a_payer'
  ]);
}

/**
 * Convertit une dépense avec ses champs numériques
 */
export function parseExpense(expense: any) {
  return parseNumericFields(expense, [
    'montant_declare',
    'montant_non_declare',
    'montant_total'
  ]);
}

/**
 * Convertit un chèque avec ses champs numériques
 */
export function parseCheck(check: any) {
  return parseNumericFields(check, [
    'montant'
  ]);
}

/**
 * Convertit un plan de paiement avec ses champs numériques
 */
export function parsePaymentPlan(plan: any) {
  return parseNumericFields(plan, [
    'numero_echeance',
    'montant_prevu',
    'montant_paye'
  ]);
}

