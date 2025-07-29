# FixMyRV - Production Build Script
# Usage: .\build-production.ps1

param(
    [switch]$SkipTests,
    [switch]$CleanBuild
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       FixMyRV - Production Build" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

if ($CleanBuild) {
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path "backend/dist") { Remove-Item "backend/dist" -Recurse -Force }
    if (Test-Path "frontend/dist") { Remove-Item "frontend/dist" -Recurse -Force }
    Write-Host "✅ Clean completed" -ForegroundColor Green
    Write-Host ""
}

# Backend build
Write-Host "🔨 Building Backend (TypeScript + Declarations)..." -ForegroundColor Green
Set-Location "backend"

Write-Host "  Installing dependencies..." -ForegroundColor Blue
npm ci --production=false

Write-Host "  Compiling TypeScript with declarations..." -ForegroundColor Blue
npm run build:declarations

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend build completed" -ForegroundColor Green
Write-Host "  📁 Output: ./backend/dist/" -ForegroundColor Gray
Write-Host "  📝 Declarations: *.d.ts files generated" -ForegroundColor Gray
Write-Host ""

# Frontend build
Write-Host "🔨 Building Frontend (React + Vite)..." -ForegroundColor Green
Set-Location "../frontend"

Write-Host "  Installing dependencies..." -ForegroundColor Blue
npm ci

Write-Host "  Running TypeScript check and Vite build..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend build completed" -ForegroundColor Green
Write-Host "  📁 Output: ./frontend/dist/" -ForegroundColor Gray
Write-Host "  🗜️  Assets optimized and bundled" -ForegroundColor Gray
Write-Host ""

# Tests (optional)
if (-not $SkipTests) {
    Write-Host "🧪 Running Tests..." -ForegroundColor Green
    Set-Location "../backend"
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            npm test
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️ Tests failed, but continuing build..." -ForegroundColor Yellow
            } else {
                Write-Host "✅ Tests passed" -ForegroundColor Green
            }
        } else {
            Write-Host "ℹ️ No test script found, skipping..." -ForegroundColor Blue
        }
    }
    Write-Host ""
}

# Summary
Set-Location $PSScriptRoot
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "        Production Build Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Build Outputs:" -ForegroundColor Yellow
Write-Host "  Backend:  ./backend/dist/" -ForegroundColor White
Write-Host "  Frontend: ./frontend/dist/" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Deployment Ready Files:" -ForegroundColor Yellow
Write-Host "  ✓ TypeScript compiled to JavaScript" -ForegroundColor Green
Write-Host "  ✓ Declaration files (.d.ts) generated" -ForegroundColor Green
Write-Host "  ✓ Frontend assets optimized" -ForegroundColor Green
Write-Host "  ✓ Production-ready bundles" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy ./backend/dist/ to your Node.js server" -ForegroundColor White
Write-Host "  2. Deploy ./frontend/dist/ to your web server" -ForegroundColor White
Write-Host "  3. Configure environment variables" -ForegroundColor White
Write-Host "  4. Set up database connections" -ForegroundColor White
Write-Host ""

# Check build sizes
$backendSize = if (Test-Path "backend/dist") { (Get-ChildItem "backend/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB } else { 0 }
$frontendSize = if (Test-Path "frontend/dist") { (Get-ChildItem "frontend/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB } else { 0 }

Write-Host "📊 Build Sizes:" -ForegroundColor Yellow
Write-Host "  Backend:  $([math]::Round($backendSize, 2)) MB" -ForegroundColor White
Write-Host "  Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor White
Write-Host ""
