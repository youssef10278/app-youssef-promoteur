import { Project, Sale, PropertyType, ProjectInventory } from '@/types/sale-new';

/**
 * Génère les numéros d'unités disponibles pour un projet
 */
export function generateAvailableUnits(
  project: Project,
  existingSales: Sale[]
): ProjectInventory {
  const soldUnits = new Set(existingSales.map(sale => sale.unite_numero));

  // Générer les numéros d'appartements
  const appartements = {
    total: project.nombre_appartements || 0,
    vendus: 0,
    disponibles: [] as string[]
  };

  for (let i = 1; i <= appartements.total; i++) {
    const unitNumber = `A${i}`;
    if (soldUnits.has(unitNumber)) {
      appartements.vendus++;
    } else {
      appartements.disponibles.push(unitNumber);
    }
  }

  // Générer les numéros de garages
  const garages = {
    total: project.nombre_garages || 0,
    vendus: 0,
    disponibles: [] as string[]
  };

  for (let i = 1; i <= garages.total; i++) {
    const unitNumber = `G${i}`;
    if (soldUnits.has(unitNumber)) {
      garages.vendus++;
    } else {
      garages.disponibles.push(unitNumber);
    }
  }

  // Pour les villas, terrains et locaux commerciaux, on utilise les lots
  const nombreLots = project.nombre_lots || 0;
  
  // Villas (on suppose 1/3 des lots pour les villas)
  const nombreVillas = Math.floor(nombreLots * 0.33);
  const villas = {
    total: nombreVillas,
    vendus: 0,
    disponibles: [] as string[]
  };

  for (let i = 1; i <= villas.total; i++) {
    const unitNumber = `V${i}`;
    if (soldUnits.has(unitNumber)) {
      villas.vendus++;
    } else {
      villas.disponibles.push(unitNumber);
    }
  }

  // Terrains (on suppose 1/3 des lots pour les terrains)
  const nombreTerrains = Math.floor(nombreLots * 0.33);
  const terrains = {
    total: nombreTerrains,
    vendus: 0,
    disponibles: [] as string[]
  };

  for (let i = 1; i <= terrains.total; i++) {
    const unitNumber = `T${i}`;
    if (soldUnits.has(unitNumber)) {
      terrains.vendus++;
    } else {
      terrains.disponibles.push(unitNumber);
    }
  }

  // Locaux commerciaux (le reste des lots)
  const nombreLocaux = nombreLots - nombreVillas - nombreTerrains;
  const locaux_commerciaux = {
    total: nombreLocaux,
    vendus: 0,
    disponibles: [] as string[]
  };

  for (let i = 1; i <= locaux_commerciaux.total; i++) {
    const unitNumber = `L${i}`;
    if (soldUnits.has(unitNumber)) {
      locaux_commerciaux.vendus++;
    } else {
      locaux_commerciaux.disponibles.push(unitNumber);
    }
  }

  return {
    project_id: project.id,
    project_nom: project.nom,
    appartements,
    garages,
    villas,
    terrains,
    locaux_commerciaux
  };
}

/**
 * Obtient les unités disponibles pour un type de propriété spécifique
 */
export function getAvailableUnitsForType(
  inventory: ProjectInventory,
  propertyType: PropertyType
): string[] {
  switch (propertyType) {
    case 'appartement':
      return inventory.appartements.disponibles;
    case 'garage':
      return inventory.garages.disponibles;
    default:
      return [];
  }
}

/**
 * Calcule les statistiques d'inventaire
 */
export function calculateInventoryStats(inventory: ProjectInventory) {
  const totalUnits = 
    inventory.appartements.total +
    inventory.garages.total +
    inventory.villas.total +
    inventory.terrains.total +
    inventory.locaux_commerciaux.total;

  const totalSold = 
    inventory.appartements.vendus +
    inventory.garages.vendus +
    inventory.villas.vendus +
    inventory.terrains.vendus +
    inventory.locaux_commerciaux.vendus;

  const totalAvailable = totalUnits - totalSold;
  const salesPercentage = totalUnits > 0 ? (totalSold / totalUnits) * 100 : 0;

  return {
    totalUnits,
    totalSold,
    totalAvailable,
    salesPercentage: Math.round(salesPercentage * 100) / 100
  };
}

/**
 * Génère automatiquement un plan de paiement
 */
export function generatePaymentPlan(
  prixTotal: number,
  nombreEcheances: number,
  dateDebut: Date,
  frequence: 'mensuelle' | 'trimestrielle' = 'mensuelle'
) {
  const montantParEcheance = Math.floor(prixTotal / nombreEcheances);
  const reste = prixTotal - (montantParEcheance * nombreEcheances);
  
  const plan = [];
  let currentDate = new Date(dateDebut);

  for (let i = 1; i <= nombreEcheances; i++) {
    // La dernière échéance récupère le reste
    const montant = i === nombreEcheances ? montantParEcheance + reste : montantParEcheance;
    
    plan.push({
      numero_echeance: i,
      description: `Échéance ${i}/${nombreEcheances}`,
      montant_prevu: montant,
      date_prevue: currentDate.toISOString().split('T')[0],
      notes: i === 1 ? 'Première échéance' : i === nombreEcheances ? 'Dernière échéance' : ''
    });

    // Calculer la prochaine date selon la fréquence
    if (frequence === 'mensuelle') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 3);
    }
  }

  return plan;
}

/**
 * Valide qu'un numéro d'unité est disponible
 */
export function isUnitAvailable(
  inventory: ProjectInventory,
  propertyType: PropertyType,
  unitNumber: string
): boolean {
  const availableUnits = getAvailableUnitsForType(inventory, propertyType);
  return availableUnits.includes(unitNumber);
}

/**
 * Formate le numéro d'unité selon le type
 */
export function formatUnitNumber(propertyType: PropertyType, number: number): string {
  const prefix = {
    appartement: 'A',
    garage: 'G',
    villa: 'V',
    terrain: 'T',
    local_commercial: 'L'
  }[propertyType];

  return `${prefix}${number}`;
}
