# Script PowerShell pour démarrer le backend
Write-Host "🚀 Démarrage du Backend Promoteur Immobilier" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Aller dans le répertoire backend
Set-Location -Path "backend"
Write-Host "📍 Répertoire: $(Get-Location)" -ForegroundColor Yellow

# Vérifier Node.js
Write-Host "🔍 Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier si le fichier compilé existe
if (-not (Test-Path "dist/server.js")) {
    Write-Host "⚠️  Fichier compilé non trouvé" -ForegroundColor Yellow
    Write-Host "🔧 Compilation en cours..." -ForegroundColor Yellow
    
    try {
        & npm run build
        Write-Host "✅ Compilation réussie" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur de compilation" -ForegroundColor Red
        exit 1
    }
}

# Vérifier PostgreSQL
Write-Host "🔍 Vérification de PostgreSQL..." -ForegroundColor Yellow
try {
    $dockerPs = docker ps --filter "name=promoteur-postgres" --format "{{.Names}}"
    if ($dockerPs -eq "promoteur-postgres") {
        Write-Host "✅ PostgreSQL en cours d'exécution" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Démarrage de PostgreSQL..." -ForegroundColor Yellow
        docker start promoteur-postgres
        Start-Sleep -Seconds 3
    }
} catch {
    Write-Host "⚠️  Docker non accessible" -ForegroundColor Yellow
}

# Démarrer le serveur
Write-Host ""
Write-Host "🌐 Démarrage du serveur..." -ForegroundColor Green
Write-Host "📍 Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "💡 Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

try {
    & node dist/server.js
} catch {
    Write-Host "❌ Erreur lors du démarrage du serveur" -ForegroundColor Red
    Write-Host "Erreur: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🛑 Serveur arrêté" -ForegroundColor Yellow
