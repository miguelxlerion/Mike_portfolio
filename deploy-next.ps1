# deploy-next.ps1 — Publica next-portfolio a rama `next` para GitHub Pages (A/B sin tocar main)
# Uso: pwsh ./deploy-next.ps1        (desde X:\Proyectos\Personal_Web_Portfolio)
# Requiere: git clean main, next-portfolio ya con npm install

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
if (-not $Root) { $Root = "X:\Proyectos\Personal_Web_Portfolio" }
Set-Location $Root

# 1. Validar main limpio (warn si hay cambios sin commit — no aborta para permitir deploy con fixes hero bold)
$dirty = git status --porcelain
if ($dirty) { Write-Host "⚠️  Hay cambios sin commit en main (se incluirán). Recomendado: git add/commit antes." -ForegroundColor Yellow }

# 2. Build
Write-Host "→ Building next-portfolio..." -ForegroundColor Cyan
Push-Location "$Root\next-portfolio"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build falló" }
Pop-Location

# 3. Preparar rama next (crea si no existe)
$hasNext = git branch --list next
if (-not $hasNext) {
  Write-Host "→ Creando rama next..." -ForegroundColor Cyan
  git checkout -b next
} else {
  git checkout next
  git merge main --no-edit  # trae fixes hero bold + admin
}

# 4. Copiar dist a raíz (sobrescribe index.html solo en rama next)
Write-Host "→ Copiando dist a raíz (rama next)..." -ForegroundColor Cyan
Copy-Item "$Root\next-portfolio\dist\*" "$Root\" -Recurse -Force
# Asegurar .nojekyll para Pages (Vite assets con _ no se ignoren)
Set-Content -Path "$Root\.nojekyll" -Value "" -Force
# No commitear next-portfolio/src ni node_modules en rama next (ya en main, pero opcional ignorar)
# git rm --cached next-portfolio si quieres limpiar historial — omitido para A/B simple

git add .
git status --short
$msg = "feat(next): Staff portfolio 3D/RAG/IoT — $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Host "Nada que commitear" -ForegroundColor Yellow } else {
  Write-Host "→ Push next → origin..." -ForegroundColor Cyan
  git push -u origin next
  Write-Host "✅ Deploy next listo. Activa en GitHub: Settings → Pages → Branch: next / (root) → Save. URL: https://miguelxlerion.github.io/Mike_portfolio/" -ForegroundColor Green
}

# 5. Volver a main
git checkout main
Write-Host "→ De vuelta en main. Preview next sigue en http://127.0.0.1:5175/Mike_portfolio/ (si sigue corriendo)" -ForegroundColor DarkGray
Write-Host "Para cutover definitivo a main: git checkout main; Copy-Item next-portfolio\dist\* . -Recurse -Force; git add .; git commit -m 'feat: promote next to main'; git push" -ForegroundColor Yellow
