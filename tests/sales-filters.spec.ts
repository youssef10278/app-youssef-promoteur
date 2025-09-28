import { test, expect } from '@playwright/test';

test.describe('Sales Filters and Search', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page de ventes
    await page.goto('http://localhost:8080/sales');
    
    // Attendre que la page soit chargée
    await page.waitForSelector('[data-testid="sales-page"]', { timeout: 10000 });
    
    // Vérifier qu'un projet est sélectionné
    await expect(page.locator('text=Ventes du Projet')).toBeVisible();
  });

  test('should display search bar and filters', async ({ page }) => {
    // Vérifier la présence de la barre de recherche
    const searchInput = page.getByPlaceholder('Rechercher par nom client, unité, numéro de chèque...');
    await expect(searchInput).toBeVisible();

    // Vérifier la présence du sélecteur de tri
    const sortSelect = page.getByRole('combobox').filter({ hasText: 'Date de création' });
    await expect(sortSelect).toBeVisible();

    // Vérifier la présence du bouton Filtres
    const filtersButton = page.getByRole('button', { name: /Filtres/ });
    await expect(filtersButton).toBeVisible();

    // Vérifier la présence du compteur de résultats
    await expect(page.locator('text=/\\d+ résultat.*trouvé/')).toBeVisible();
  });

  test('should perform text search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher par nom client, unité, numéro de chèque...');
    
    // Effectuer une recherche
    await searchInput.fill('A1');
    
    // Vérifier que le badge de recherche apparaît
    await expect(page.locator('text=Recherche: "A1"')).toBeVisible();
    
    // Vérifier que le bouton Filtres affiche un badge
    await expect(page.getByRole('button', { name: /Filtres.*1/ })).toBeVisible();
    
    // Vérifier que le bouton de reset apparaît
    const resetButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(-1);
    await expect(resetButton).toBeVisible();
  });

  test('should clear search with reset button', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher par nom client, unité, numéro de chèque...');
    
    // Effectuer une recherche
    await searchInput.fill('test');
    await expect(page.locator('text=Recherche: "test"')).toBeVisible();
    
    // Cliquer sur le bouton de reset
    const resetButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(-1);
    await resetButton.click();
    
    // Vérifier que la recherche est effacée
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('text=Recherche: "test"')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Filtres.*1/ })).not.toBeVisible();
  });

  test('should expand and collapse advanced filters', async ({ page }) => {
    const filtersButton = page.getByRole('button', { name: /Filtres/ });
    
    // Les filtres avancés ne doivent pas être visibles initialement
    await expect(page.locator('text=Statut')).not.toBeVisible();
    
    // Cliquer pour développer les filtres
    await filtersButton.click();
    
    // Vérifier que les filtres avancés sont visibles
    await expect(page.locator('text=Statut')).toBeVisible();
    await expect(page.locator('text=Type de propriété')).toBeVisible();
    await expect(page.locator('text=Mode de paiement')).toBeVisible();
    await expect(page.locator('text=Date début')).toBeVisible();
    await expect(page.locator('text=Date fin')).toBeVisible();
    await expect(page.locator('text=Montant min (DH)')).toBeVisible();
    await expect(page.locator('text=Montant max (DH)')).toBeVisible();
    
    // Cliquer à nouveau pour replier
    await filtersButton.click();
    
    // Vérifier que les filtres sont repliés
    await expect(page.locator('text=Statut')).not.toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    // Développer les filtres
    await page.getByRole('button', { name: /Filtres/ }).click();
    
    // Cliquer sur le filtre Statut
    const statusSelect = page.getByRole('combobox').filter({ hasText: 'Tous les statuts' });
    await statusSelect.click();
    
    // Vérifier que les options sont visibles
    await expect(page.getByRole('option', { name: 'Tous les statuts' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'En cours' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Terminé' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Annulé' })).toBeVisible();
    
    // Sélectionner "En cours"
    await page.getByRole('option', { name: 'En cours' }).click();
    
    // Vérifier que le filtre est appliqué
    await expect(page.locator('text=Statut: En cours')).toBeVisible();
  });

  test('should filter by property type', async ({ page }) => {
    // Développer les filtres
    await page.getByRole('button', { name: /Filtres/ }).click();
    
    // Cliquer sur le filtre Type de propriété
    const typeSelect = page.getByRole('combobox').filter({ hasText: 'Tous les types' });
    await typeSelect.click();
    
    // Vérifier que les options sont visibles
    await expect(page.getByRole('option', { name: 'Tous les types' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Appartement' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Garage' })).toBeVisible();
    
    // Sélectionner "Appartement"
    await page.getByRole('option', { name: 'Appartement' }).click();
    
    // Vérifier que le filtre est appliqué
    await expect(page.locator('text=Type: Appartement')).toBeVisible();
  });

  test('should filter by payment mode', async ({ page }) => {
    // Développer les filtres
    await page.getByRole('button', { name: /Filtres/ }).click();
    
    // Cliquer sur le filtre Mode de paiement
    const modeSelect = page.getByRole('combobox').filter({ hasText: 'Tous les modes' });
    await modeSelect.click();
    
    // Vérifier que les options sont visibles
    await expect(page.getByRole('option', { name: 'Tous les modes' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Espèces' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Chèque' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Chèque et Espèces' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Virement' })).toBeVisible();
  });

  test('should filter by amount range', async ({ page }) => {
    // Développer les filtres
    await page.getByRole('button', { name: /Filtres/ }).click();
    
    // Remplir le montant minimum
    const minAmountInput = page.getByRole('spinbutton').first();
    await minAmountInput.fill('100000');
    
    // Remplir le montant maximum
    const maxAmountInput = page.getByRole('spinbutton').last();
    await maxAmountInput.fill('1000000');
    
    // Vérifier que les valeurs sont saisies
    await expect(minAmountInput).toHaveValue('100000');
    await expect(maxAmountInput).toHaveValue('1000000');
  });

  test('should change sort order', async ({ page }) => {
    // Cliquer sur le bouton de tri (flèche)
    const sortButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await sortButton.click();
    
    // Vérifier que l'ordre de tri a changé (l'icône devrait changer)
    // Note: Nous pourrions vérifier l'ordre des résultats si nous avions plus de données
  });

  test('should change sort criteria', async ({ page }) => {
    // Cliquer sur le sélecteur de tri
    const sortSelect = page.getByRole('combobox').filter({ hasText: 'Date de création' });
    await sortSelect.click();
    
    // Vérifier que les options de tri sont visibles
    await expect(page.getByRole('option', { name: 'Date de création' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Nom du client' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Prix total' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Numéro d\'unité' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Progression' })).toBeVisible();
    
    // Sélectionner "Nom du client"
    await page.getByRole('option', { name: 'Nom du client' }).click();
    
    // Vérifier que le critère de tri a changé
    await expect(page.getByRole('combobox').filter({ hasText: 'Nom du client' })).toBeVisible();
  });

  test('should remove individual filter badges', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher par nom client, unité, numéro de chèque...');
    
    // Effectuer une recherche
    await searchInput.fill('test');
    await expect(page.locator('text=Recherche: "test"')).toBeVisible();
    
    // Cliquer sur le X du badge de recherche
    const removeBadgeButton = page.locator('text=Recherche: "test"').locator('svg');
    await removeBadgeButton.click();
    
    // Vérifier que la recherche est supprimée
    await expect(page.locator('text=Recherche: "test"')).not.toBeVisible();
    await expect(searchInput).toHaveValue('');
  });

  test('should combine multiple filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher par nom client, unité, numéro de chèque...');
    
    // Effectuer une recherche
    await searchInput.fill('A1');
    
    // Développer les filtres
    await page.getByRole('button', { name: /Filtres/ }).click();
    
    // Appliquer un filtre de statut
    const statusSelect = page.getByRole('combobox').filter({ hasText: 'Tous les statuts' });
    await statusSelect.click();
    await page.getByRole('option', { name: 'En cours' }).click();
    
    // Vérifier que les deux filtres sont actifs
    await expect(page.locator('text=Recherche: "A1"')).toBeVisible();
    await expect(page.locator('text=Statut: En cours')).toBeVisible();
    
    // Vérifier que le compteur de filtres affiche 2
    await expect(page.getByRole('button', { name: /Filtres.*2/ })).toBeVisible();
  });

  test('should display correct results count', async ({ page }) => {
    // Vérifier que le compteur de résultats est affiché
    const resultsText = page.locator('text=/\\d+ résultat.*trouvé/');
    await expect(resultsText).toBeVisible();
    
    // Le texte devrait contenir un nombre
    const text = await resultsText.textContent();
    expect(text).toMatch(/\d+ résultat/);
  });

  test('should handle date filters', async ({ page }) => {
    // Développer les filtres
    await page.getByRole('button', { name: /Filtres/ }).click();
    
    // Cliquer sur Date début
    const startDateButton = page.getByRole('button', { name: 'Sélectionner' }).first();
    await startDateButton.click();
    
    // Vérifier que le calendrier s'ouvre
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Fermer le calendrier en cliquant ailleurs
    await page.keyboard.press('Escape');
    
    // Cliquer sur Date fin
    const endDateButton = page.getByRole('button', { name: 'Sélectionner' }).last();
    await endDateButton.click();
    
    // Vérifier que le calendrier s'ouvre
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
