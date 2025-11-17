# ============================================================================
# Paprika - Environment Secrets Setup (Google Drive / OneDrive + Symlink)
# ============================================================================
#
# This script automates the setup of .env.local synchronization using
# cloud storage (Google Drive or OneDrive) with symbolic links.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-env-cloud.ps1
#
# Requirements:
#   - Google Drive or OneDrive installed and synced
#   - PowerShell with Administrator rights (for symlink creation)
#
# ============================================================================

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ""
Write-Host "Paprika - Environment Secrets Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Symbolic link creation requires Administrator rights on Windows." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor White
    Write-Host "1. Close this window" -ForegroundColor White
    Write-Host "2. Right-click PowerShell → 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Re-run this script" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Detect Cloud Storage Provider
# ============================================================================

Write-Host "Detecting cloud storage..." -ForegroundColor Cyan

$googleDrivePath = $null
$oneDrivePath = $null

# Check Google Drive
$possibleGooglePaths = @(
    "$env:USERPROFILE\Google Drive\My Drive",
    "G:\My Drive",
    "$env:USERPROFILE\GoogleDrive"
)

foreach ($path in $possibleGooglePaths) {
    if (Test-Path $path) {
        $googleDrivePath = $path
        break
    }
}

# Check OneDrive
if (Test-Path "$env:USERPROFILE\OneDrive") {
    $oneDrivePath = "$env:USERPROFILE\OneDrive"
}

# Display detected providers
if ($googleDrivePath) {
    Write-Host "  [OK] Google Drive found: $googleDrivePath" -ForegroundColor Green
}
if ($oneDrivePath) {
    Write-Host "  [OK] OneDrive found: $oneDrivePath" -ForegroundColor Green
}

if (-not $googleDrivePath -and -not $oneDrivePath) {
    Write-Host "  [ERROR] No cloud storage detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install and configure one of:" -ForegroundColor Yellow
    Write-Host "  - Google Drive for Desktop" -ForegroundColor White
    Write-Host "  - Microsoft OneDrive" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Let user choose if both are available
$cloudPath = $null
if ($googleDrivePath -and $oneDrivePath) {
    Write-Host ""
    Write-Host "Both cloud providers detected. Which one do you want to use?" -ForegroundColor Yellow
    Write-Host "  1. Google Drive" -ForegroundColor White
    Write-Host "  2. OneDrive" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Enter choice (1 or 2)"

    if ($choice -eq "1") {
        $cloudPath = $googleDrivePath
        $cloudName = "Google Drive"
    } elseif ($choice -eq "2") {
        $cloudPath = $oneDrivePath
        $cloudName = "OneDrive"
    } else {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
} elseif ($googleDrivePath) {
    $cloudPath = $googleDrivePath
    $cloudName = "Google Drive"
} else {
    $cloudPath = $oneDrivePath
    $cloudName = "OneDrive"
}

Write-Host ""
Write-Host "Using: $cloudName" -ForegroundColor Cyan
Write-Host "   Path: $cloudPath" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Create Secrets Directory
# ============================================================================

$secretsDir = Join-Path $cloudPath "Dev\paprika-secrets"

Write-Host "Creating secrets directory..." -ForegroundColor Cyan

if (-not (Test-Path $secretsDir)) {
    try {
        New-Item -ItemType Directory -Path $secretsDir -Force | Out-Null
        Write-Host "  [OK] Created: $secretsDir" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Failed to create directory: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "  [OK] Directory already exists" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# Copy .env.local to Cloud
# ============================================================================

$projectEnvFile = ".\.env.local"
$cloudEnvFile = Join-Path $secretsDir ".env.local"

Write-Host "Copying .env.local to cloud..." -ForegroundColor Cyan

if (-not (Test-Path $projectEnvFile)) {
    Write-Host "  [ERROR] .env.local not found in project root" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env.local first:" -ForegroundColor Yellow
    Write-Host "  1. Copy .env.local.example to .env.local" -ForegroundColor White
    Write-Host "  2. Fill in your actual credentials" -ForegroundColor White
    Write-Host "  3. Re-run this script" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if cloud file already exists
if (Test-Path $cloudEnvFile) {
    Write-Host "  [WARNING] .env.local already exists in cloud" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Overwrite with local version? (y/n)"

    if ($overwrite -ne "y") {
        Write-Host "  [INFO] Keeping existing cloud version" -ForegroundColor Cyan
    } else {
        Copy-Item $projectEnvFile $cloudEnvFile -Force
        Write-Host "  [OK] Overwritten cloud version" -ForegroundColor Green
    }
} else {
    Copy-Item $projectEnvFile $cloudEnvFile -Force
    Write-Host "  [OK] Copied to: $cloudEnvFile" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# Create Symbolic Link
# ============================================================================

Write-Host "Creating symbolic link..." -ForegroundColor Cyan

# Backup existing .env.local (if not already a symlink)
if (Test-Path $projectEnvFile) {
    $item = Get-Item $projectEnvFile

    if ($item.LinkType -eq "SymbolicLink") {
        Write-Host "  [INFO] Existing symlink detected, removing..." -ForegroundColor Cyan
        Remove-Item $projectEnvFile -Force
    } else {
        $backupPath = ".\.env.local.backup"
        Write-Host "  [INFO] Backing up existing .env.local to .env.local.backup" -ForegroundColor Cyan
        Copy-Item $projectEnvFile $backupPath -Force
        Remove-Item $projectEnvFile -Force
    }
}

# Create symlink
try {
    New-Item -ItemType SymbolicLink -Path $projectEnvFile -Target $cloudEnvFile -Force | Out-Null
    Write-Host "  [OK] Symbolic link created successfully" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Failed to create symbolic link: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure you're running as Administrator" -ForegroundColor White
    Write-Host "  2. Check that $cloudName is fully synced" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# ============================================================================
# Verify Setup
# ============================================================================

Write-Host "Verifying setup..." -ForegroundColor Cyan

# Check symlink
$linkInfo = Get-Item $projectEnvFile
if ($linkInfo.LinkType -eq "SymbolicLink") {
    Write-Host "  [OK] Symlink type: OK" -ForegroundColor Green
    Write-Host "     Target: $($linkInfo.Target)" -ForegroundColor Gray
} else {
    Write-Host "  [ERROR] Not a symbolic link" -ForegroundColor Red
}

# Check content accessible
try {
    $content = Get-Content $projectEnvFile -ErrorAction Stop
    if ($content.Length -gt 0) {
        Write-Host "  [OK] Content accessible: OK" -ForegroundColor Green
        Write-Host "     Lines: $($content.Length)" -ForegroundColor Gray
    } else {
        Write-Host "  [WARNING] File is empty" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Cannot read content: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Summary
# ============================================================================

Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Cloud storage: $cloudName" -ForegroundColor White
Write-Host "  Secrets directory: $secretsDir" -ForegroundColor White
Write-Host "  Symbolic link: $projectEnvFile -> $cloudEnvFile" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Your .env.local is now synced to $cloudName" -ForegroundColor White
Write-Host "  2. Changes will sync automatically across devices" -ForegroundColor White
Write-Host "  3. On other PCs, run this script again after $cloudName syncs" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Never commit .env.local to Git (already in .gitignore)" -ForegroundColor White
Write-Host "  - Enable 2FA on your $cloudName account for security" -ForegroundColor White
Write-Host "  - Keep your secrets safe!" -ForegroundColor White
Write-Host ""
Write-Host "Full documentation: docs/12-environment-secrets.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
