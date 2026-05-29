# ============================================================
# deploy.ps1 — Script completo de deploy do Ascendia
# Uso: .\deploy.ps1
# Uso com mensagem: .\deploy.ps1 "minha mensagem de commit"
# ============================================================

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $base

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   ASCENDIA — DEPLOY PARA PRODUCAO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. TypeScript check ──────────────────────────────────────
Write-Host "[1/5] Verificando TypeScript..." -ForegroundColor Yellow
$ts = & npx tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO TypeScript:" -ForegroundColor Red
    Write-Host $ts
    exit 1
}
Write-Host "     OK — zero erros TypeScript" -ForegroundColor Green

# ── 2. Build local ───────────────────────────────────────────
Write-Host "[2/5] Verificando build..." -ForegroundColor Yellow
$build = & npm run build 2>&1 | Select-String "error|Error|Failed|Compiled" | Select-Object -First 5
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no build:" -ForegroundColor Red
    Write-Host $build
    exit 1
}
Write-Host "     OK — build limpo" -ForegroundColor Green

# ── 3. Git status ────────────────────────────────────────────
Write-Host "[3/5] Verificando mudancas..." -ForegroundColor Yellow
$status = & git status --porcelain 2>&1
$hasChanges = $status.Trim().Length -gt 0

if ($hasChanges) {
    Write-Host "     Mudancas encontradas — commitando..." -ForegroundColor Yellow

    if ($Message -eq "") {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $Message = "deploy: atualizacoes $timestamp"
    }

    & git add -A
    & git commit -m "$Message`n`nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO no commit" -ForegroundColor Red
        exit 1
    }
    Write-Host "     OK — commit criado" -ForegroundColor Green
} else {
    Write-Host "     Nada para commitar — tudo limpo" -ForegroundColor Green
}

# ── 4. Confirma projeto Vercel ───────────────────────────────
Write-Host "[4/5] Projeto Vercel..." -ForegroundColor Yellow
$proj = Get-Content ".vercel/project.json" | ConvertFrom-Json
Write-Host "     Projeto: $($proj.projectName)" -ForegroundColor Green

# ── 5. Deploy para producao ──────────────────────────────────
Write-Host "[5/5] Deployando para producao..." -ForegroundColor Yellow
Write-Host ""
& vercel --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO no deploy" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "   DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "   https://fitquest-app1.vercel.app" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
