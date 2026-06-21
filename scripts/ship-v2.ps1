# ============================================================
# NYTHIS Obsidian Game Play v2.0.0 — Ship Script
# Window-safe: no exit statements, errors reported inline
# ============================================================
$ErrorActionPreference = "Continue"

function Step($n, $msg) {
  Write-Host ""
  Write-Host ("============================================================") -ForegroundColor DarkCyan
  Write-Host ("  STEP " + $n + " — " + $msg) -ForegroundColor Cyan
  Write-Host ("============================================================") -ForegroundColor DarkCyan
}

function Ok($msg)   { Write-Host ("  OK: " + $msg) -ForegroundColor Green }
function Warn($msg) { Write-Host ("  WARN: " + $msg) -ForegroundColor Yellow }
function Fail($msg) { Write-Host ("  FAIL: " + $msg) -ForegroundColor Red }

cd "C:\Users\NYTHIS OBSIDIAN\Desktop\nythis-obsidian-game-play"

# ============================================================
Step 1 "Stop dev server + clean backups"
# ============================================================
$p = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($p) { $p | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Milliseconds 600 }
$p = Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue
if ($p) { $p | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Milliseconds 600 }
Ok "Dev/preview ports cleared"

Get-ChildItem -Recurse -Path "src" -Filter "*.backup" -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
}
Ok ".backup files removed"

# ============================================================
Step 2 "Production build"
# ============================================================
npm run build 2>&1 | Select-Object -Last 10
if ($LASTEXITCODE -eq 0) { Ok "Build clean" } else { Fail "Build failed — STOP"; Read-Host "Press ENTER to close"; return }

# ============================================================
Step 3 "LOCAL PRODUCTION SMOKE TEST — preview built dist/"
# ============================================================
Write-Host "  Starting vite preview on 127.0.0.1:4173..."
$previewJob = Start-Job -ScriptBlock {
  param($path)
  Set-Location $path
  npx vite preview --host 127.0.0.1 --port 4173 --strictPort
} -ArgumentList (Get-Location).Path

Start-Sleep -Seconds 5

$smokeUrl = "http://127.0.0.1:4173/nythis-obsidian-game-play/"
$smokeOk = $false
try {
  $resp = Invoke-WebRequest -Uri $smokeUrl -UseBasicParsing -TimeoutSec 10
  if ($resp.StatusCode -eq 200 -and $resp.Content -match "OBSIDIAN GAME PLAY") {
    $smokeOk = $true
    Ok ("Local preview returns 200 with hub markup at " + $smokeUrl)
  } else {
    Fail ("Local preview HTTP " + $resp.StatusCode + " or markup missing")
  }
} catch {
  Fail ("Local preview unreachable: " + $_.Exception.Message)
}

Stop-Job -Job $previewJob -ErrorAction SilentlyContinue
Remove-Job -Job $previewJob -Force -ErrorAction SilentlyContinue
$p = Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue
if ($p) { $p | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }

if (-not $smokeOk) { Fail "Local smoke failed — STOP before pushing"; Read-Host "Press ENTER to close"; return }

# ============================================================
Step 4 "Install gh-pages (if missing)"
# ============================================================
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasGhPages = $pkg.devDependencies.PSObject.Properties.Name -contains "gh-pages"
if (-not $hasGhPages) {
  npm install --save-dev gh-pages
  if ($LASTEXITCODE -eq 0) { Ok "gh-pages installed" } else { Fail "gh-pages install failed"; Read-Host "Press ENTER to close"; return }
} else {
  Ok "gh-pages already installed"
}

# ============================================================
Step 5 "Configure deploy scripts + .nojekyll"
# ============================================================
if (-not (Test-Path "public")) { New-Item -ItemType Directory -Path "public" -Force | Out-Null }
"" | Set-Content -Path "public\.nojekyll" -Encoding ASCII -NoNewline
Ok "public/.nojekyll set"

npm pkg set "scripts.predeploy=npm run build" | Out-Null
npm pkg set "scripts.deploy=gh-pages -d dist -t true" | Out-Null
npm pkg set "homepage=https://bigstodg120.github.io/nythis-obsidian-game-play" | Out-Null
Ok "Deploy scripts + homepage configured"

# ============================================================
Step 6 "Git status"
# ============================================================
$isGit = Test-Path ".git"
if (-not $isGit) {
  Warn "No .git directory. ONE-TIME SETUP:"
  Write-Host ""
  Write-Host "  1. Open: https://github.com/new" -ForegroundColor White
  Write-Host "  2. Repository name: nythis-obsidian-game-play" -ForegroundColor White
  Write-Host "  3. Visibility: Public" -ForegroundColor White
  Write-Host "  4. Do NOT initialize with README/license/.gitignore" -ForegroundColor White
  Write-Host "  5. Click Create repository" -ForegroundColor White
  Write-Host ""
  Read-Host "Press ENTER once the empty repo exists"

  if (-not (Test-Path ".gitignore")) {
    @"
node_modules/
dist/
.env
.env.local
*.backup
.DS_Store
playwright-report/
test-results/
"@ | Set-Content -Path ".gitignore" -Encoding UTF8
    Ok ".gitignore created"
  }

  git init
  git branch -M main
  git add .
  git commit -m "v2.0.0 - NYTHIS Obsidian Game Play (7 games + cosmic environment)"
  git remote add origin "https://github.com/bigstodg120/nythis-obsidian-game-play.git"
  git push -u origin main
  if ($LASTEXITCODE -eq 0) { Ok "Initial push to main complete" } else { Fail "Initial push failed — check GitHub auth"; Read-Host "Press ENTER to close"; return }
} else {
  git add .
  $hasChanges = git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    git commit -m "v2.0.0 - cosmic env final, hub clean, 7 games shipped"
    git push origin main
    if ($LASTEXITCODE -eq 0) { Ok "Changes pushed to main" } else { Fail "Push failed"; Read-Host "Press ENTER to close"; return }
  } else {
    Ok "No new changes to commit"
  }
}

# ============================================================
Step 7 "Deploy to gh-pages branch"
# ============================================================
npm run deploy
if ($LASTEXITCODE -eq 0) { Ok "Deployed to gh-pages branch" } else { Fail "Deploy failed"; Read-Host "Press ENTER to close"; return }

# ============================================================
Step 8 "Tag v2.0.0"
# ============================================================
$tagExists = git tag -l "v2.0.0"
if ($tagExists) {
  Ok "Tag v2.0.0 already exists"
} else {
  git tag v2.0.0
  git push origin v2.0.0
  if ($LASTEXITCODE -eq 0) { Ok "Tag v2.0.0 pushed" } else { Warn "Tag push failed but deploy succeeded" }
}

# ============================================================
Step 9 "GitHub Pages settings (one-time only)"
# ============================================================
Write-Host ""
Write-Host "  If this is the FIRST deploy:" -ForegroundColor Yellow
Write-Host "  1. Open: https://github.com/bigstodg120/nythis-obsidian-game-play/settings/pages" -ForegroundColor White
Write-Host "  2. Source: Deploy from a branch" -ForegroundColor White
Write-Host "  3. Branch: gh-pages    Folder: / (root)" -ForegroundColor White
Write-Host "  4. Save" -ForegroundColor White
Write-Host ""
Write-Host "  If already configured: skip this step." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press ENTER to continue to live smoke test"

# ============================================================
Step 10 "Live smoke test"
# ============================================================
Write-Host "  Waiting 60s for propagation..."
Start-Sleep -Seconds 60

$url = "https://bigstodg120.github.io/nythis-obsidian-game-play/"
$success = $false
for ($i = 1; $i -le 6; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    if ($resp.StatusCode -eq 200 -and $resp.Content -match "OBSIDIAN GAME PLAY") {
      Ok ("Live [" + $i + "/6]: 200 OK with hub markup")
      $success = $true
      break
    } else {
      Warn ("Attempt " + $i + ": HTTP " + $resp.StatusCode + " — propagating, waiting 30s")
      Start-Sleep -Seconds 30
    }
  } catch {
    Warn ("Attempt " + $i + " exception — propagating, waiting 30s")
    Start-Sleep -Seconds 30
  }
}

Write-Host ""
Write-Host ("============================================================") -ForegroundColor Green
if ($success) {
  Write-Host "  v2.0.0 SHIPPED" -ForegroundColor Green
  Write-Host ("  Live: " + $url) -ForegroundColor White
  Write-Host "  Tag:  v2.0.0" -ForegroundColor White
  Start-Process $url
} else {
  Write-Host "  v2.0.0 DEPLOYED but live smoke didn't confirm in 3 min" -ForegroundColor Yellow
  Write-Host ("  Manual check: " + $url) -ForegroundColor White
  Write-Host "  First publishes can take up to 10 min. Try again shortly." -ForegroundColor Yellow
}
Write-Host ("============================================================") -ForegroundColor Green

Read-Host "Press ENTER to close this window"
