import Joi from 'joi';

// Schémas de validation pour l'authentification
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Mot de passe requis'
  }),
  nom: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères',
    'any.required': 'Nom requis'
  }),
  telephone: Joi.string().optional().allow(''),
  societe: Joi.string().optional().allow('')
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Schémas de validation pour les projets
export const createProjectSchema = Joi.object({
  nom: Joi.string().min(2).max(200).required(),
  localisation: Joi.string().min(2).max(500).required(),
  societe: Joi.string().min(2).max(200).required(),
  surface_totale: Joi.number().positive().required(),
  nombre_lots: Joi.number().integer().min(1).required(),
  nombre_appartements: Joi.number().integer().min(0).default(0),
  nombre_garages: Joi.number().integer().min(0).default(0),
  description: Joi.string().max(1000).optional().allow('')
});

export const updateProjectSchema = createProjectSchema.fork(
  ['nom', 'localisation', 'societe', 'surface_totale', 'nombre_lots'],
  (schema) => schema.optional()
);

// Schémas de validation pour les ventes
export const createSaleSchema = Joi.object({
  project_id: Joi.string().uuid().required(),
  type_propriete: Joi.string().valid('appartement', 'garage').required(),
  unite_numero: Joi.string().min(1).max(50).required(),
  client_nom: Joi.string().min(2).max(200).required(),
  client_telephone: Joi.string().optional().allow(''),
  client_email: Joi.string().email().optional().allow(''),
  client_adresse: Joi.string().max(500).optional().allow(''),
  surface: Joi.number().positive().required(),
  prix_total: Joi.number().positive().required(),
  description: Joi.string().min(2).max(500).required(),
  mode_paiement: Joi.string().valid('espece', 'cheque', 'cheque_espece', 'virement').required(),
  avance_declare: Joi.number().min(0).default(0),
  avance_non_declare: Joi.number().min(0).default(0),
  avance_cheque: Joi.number().min(0).default(0),
  avance_espece: Joi.number().min(0).default(0),
  // CORRECTION: Ajouter support pour les données des chèques
  cheques: Joi.array().items(
    Joi.object({
      numero: Joi.string().max(50).required(),
      banque: Joi.string().max(200).required(),
      montant: Joi.number().positive().required(),
      date_echeance: Joi.date().required()
    })
  ).optional().default([])
});

// Schémas de validation pour les dépenses
export const createExpenseSchema = Joi.object({
  project_id: Joi.string().uuid().required(),
  nom: Joi.string().min(2).max(200).required(),
  montant_declare: Joi.number().min(0).default(0),
  montant_non_declare: Joi.number().min(0).default(0),
  mode_paiement: Joi.string().valid('cheque', 'espece', 'cheque_espece', 'virement').required(),
  description: Joi.string().max(1000).optional().allow('')
});

// Nouveau schéma pour créer une dépense simple (sans montant)
export const createSimpleExpenseSchema = Joi.object({
  project_id: Joi.string().uuid().required(),
  nom: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional().allow('')
});

// Schéma pour ajouter un paiement à une dépense
export const createExpensePaymentSchema = Joi.object({
  montant_paye: Joi.number().min(0.01).required(),
  montant_declare: Joi.number().min(0).default(0),
  montant_non_declare: Joi.number().min(0).default(0),
  date_paiement: Joi.date().iso().required(),
  mode_paiement: Joi.string().valid('espece', 'cheque', 'cheque_espece', 'virement').required(),
  description: Joi.string().max(500).optional().allow(''),
  reference_paiement: Joi.string().max(100).optional().allow('')
}).custom((value, helpers) => {
  // Vérifier que montant_paye = montant_declare + montant_non_declare
  const total = value.montant_declare + value.montant_non_declare;
  if (Math.abs(total - value.montant_paye) > 0.01) {
    return helpers.error('custom.montant_incoherent');
  }
  return value;
}, 'Validation cohérence montants').messages({
  'custom.montant_incoherent': 'Le montant payé doit être égal à la somme des montants déclaré et non déclaré'
});

// Schémas de validation pour les chèques
export const createCheckSchema = Joi.object({
  project_id: Joi.string().uuid().optional(),
  sale_id: Joi.string().uuid().optional(),
  expense_id: Joi.string().uuid().optional(),
  type_cheque: Joi.string().valid('recu', 'donne').required(),
  montant: Joi.number().positive().required(),
  numero_cheque: Joi.string().max(50).optional().allow(''),
  nom_beneficiaire: Joi.string().max(200).optional().allow(''),
  nom_emetteur: Joi.string().max(200).optional().allow(''),
  date_emission: Joi.date().required(),
  date_encaissement: Joi.date().optional(),
  statut: Joi.string().valid('emis', 'encaisse', 'annule').default('emis'),
  facture_recue: Joi.boolean().default(false),
  description: Joi.string().max(1000).optional().allow('')
});

// Schémas de validation pour les plans de paiement
export const createPaymentPlanSchema = Joi.object({
  sale_id: Joi.string().uuid().required(),
  numero_echeance: Joi.number().integer().min(1).required(),
  date_prevue: Joi.date().required(),
  montant_prevu: Joi.number().positive().required(),
  description: Joi.string().max(500).optional().allow('')
});

// Schémas de validation pour les paiements
export const createPaymentSchema = Joi.object({
  payment_plan_id: Joi.string().uuid().required(),
  montant_paye: Joi.number().positive().required(),
  mode_paiement: Joi.string().valid('espece', 'cheque', 'cheque_espece', 'virement').required(),
  montant_espece: Joi.number().min(0).default(0),
  montant_cheque: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).optional().allow('')
});

// Schémas de validation pour les filtres
export const salesFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('created_at', 'client_nom', 'prix_total', 'unite_numero', 'statut').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().max(200).optional(),
  statut: Joi.string().valid('en_cours', 'termine', 'annule').optional(),
  type_propriete: Joi.string().valid('appartement', 'garage').optional(),
  mode_paiement: Joi.string().valid('espece', 'cheque', 'cheque_espece', 'virement').optional(),
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().optional(),
  montant_min: Joi.number().min(0).optional(),
  montant_max: Joi.number().min(0).optional()
});

// Fonction utilitaire pour valider les données
export const validate = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new Error(`Validation échouée: ${messages.join(', ')}`);
  }
  
  return value;
};
