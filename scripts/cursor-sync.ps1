#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Synchronizes shared Cursor configuration from central 'rules' repository to a project.

.DESCRIPTION
    Copies agents, skills, shared rules, templates, and process docs from the central
    'rules' repository to the current project. Does NOT touch project-specific files
    like .cursor/rules/project.md, docs/SPECIFICATION.md, docs/ARCHITECTURE.md, or dev_docs/.

.PARAMETER Source
    Path to the central 'rules' repository. If not provided, reads from .cursor-sync.json.

.PARAMETER DryRun
    Preview changes without copying files.

.EXAMPLE
    # From project root:
    .\scripts\cursor-sync.ps1

    # With explicit source:
    .\scripts\cursor-sync.ps1 -Source "../rules"

    # Preview only:
    .\scripts\cursor-sync.ps1 -DryRun
#>

param(
    [string]$Source,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step($msg) { Write-Host "  [SYNC] $msg" -ForegroundColor Cyan }
function Write-Skip($msg) { Write-Host "  [SKIP] $msg" -ForegroundColor Yellow }
function Write-Done($msg) { Write-Host "  [DONE] $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "  [ERROR] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Cursor Config Sync" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Resolve source path
if (-not $Source) {
    $configFile = Join-Path $PWD ".cursor-sync.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile -Raw | ConvertFrom-Json
        $Source = $config.source
        Write-Step "Source from .cursor-sync.json: $Source"
    } else {
        Write-Err ".cursor-sync.json not found and -Source not provided."
        Write-Host ""
        Write-Host "Create .cursor-sync.json in your project root:" -ForegroundColor Yellow
        Write-Host '  { "source": "../rules" }' -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or run with -Source parameter:" -ForegroundColor Yellow
        Write-Host '  .\scripts\cursor-sync.ps1 -Source "../rules"' -ForegroundColor Yellow
        exit 1
    }
}

# Resolve to absolute path
$Source = Resolve-Path $Source -ErrorAction SilentlyContinue
if (-not $Source -or -not (Test-Path $Source)) {
    Write-Err "Source path not found: $Source"
    exit 1
}

Write-Step "Source: $Source"
Write-Step "Target: $PWD"
if ($DryRun) { Write-Host "  [MODE] DRY RUN - no files will be copied" -ForegroundColor Magenta }
Write-Host ""

$copied = 0
$skipped = 0

# Helper: Copy directory contents
function Sync-Directory {
    param(
        [string]$RelativePath,
        [string]$Description
    )

    $srcDir = Join-Path $Source $RelativePath
    $dstDir = Join-Path $PWD $RelativePath

    if (-not (Test-Path $srcDir)) {
        Write-Skip "$Description - source not found: $RelativePath"
        $script:skipped++
        return
    }

    Write-Step "$Description"

    if (-not $DryRun) {
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
    }

    Get-ChildItem -Path $srcDir -Recurse -File | ForEach-Object {
        $relativeTo = $_.FullName.Substring($srcDir.Length + 1)
        $dstFile = Join-Path $dstDir $relativeTo
        $dstFileDir = Split-Path $dstFile -Parent

        if (-not $DryRun) {
            if (-not (Test-Path $dstFileDir)) {
                New-Item -ItemType Directory -Path $dstFileDir -Force | Out-Null
            }
            Copy-Item $_.FullName -Destination $dstFile -Force
        }

        Write-Host "    $RelativePath/$relativeTo" -ForegroundColor Gray
        $script:copied++
    }
}

# Helper: Copy specific files matching pattern
function Sync-Files {
    param(
        [string]$SourceDir,
        [string]$DestDir,
        [string]$Pattern,
        [string]$Description,
        [string[]]$Exclude = @()
    )

    $srcDir = Join-Path $Source $SourceDir
    $dstDir = Join-Path $PWD $DestDir

    if (-not (Test-Path $srcDir)) {
        Write-Skip "$Description - source not found: $SourceDir"
        $script:skipped++
        return
    }

    Write-Step "$Description"

    if (-not $DryRun -and -not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }

    Get-ChildItem -Path $srcDir -Filter $Pattern -File | Where-Object {
        $_.Name -notin $Exclude
    } | ForEach-Object {
        $dstFile = Join-Path $dstDir $_.Name

        if (-not $DryRun) {
            Copy-Item $_.FullName -Destination $dstFile -Force
        }

        Write-Host "    $DestDir/$($_.Name)" -ForegroundColor Gray
        $script:copied++
    }
}

# Helper: Copy single file
function Sync-File {
    param(
        [string]$RelativePath,
        [string]$Description
    )

    $srcFile = Join-Path $Source $RelativePath
    $dstFile = Join-Path $PWD $RelativePath

    if (-not (Test-Path $srcFile)) {
        Write-Skip "$Description - not found: $RelativePath"
        $script:skipped++
        return
    }

    Write-Step "$Description"

    if (-not $DryRun) {
        $dstDir = Split-Path $dstFile -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item $srcFile -Destination $dstFile -Force
    }

    Write-Host "    $RelativePath" -ForegroundColor Gray
    $script:copied++
}

# =====================
# SYNC OPERATIONS
# =====================

# 1. Agents (all files)
Sync-Directory ".cursor/agents" "Agents (16 templates)"

# 2. Skills (all directories)
Sync-Directory ".cursor/skills" "Skills (7 skills)"

# 3. Shared rules (00-08 numbered files only, NOT project.md)
Sync-Files ".cursor/rules" ".cursor/rules" "0*.md" "Shared rules (numbered)" @("project.md")

# 4. Doc templates
Sync-Files "docs" "docs" "*_TEMPLATE.md" "Doc templates (SPECIFICATION, ARCHITECTURE)"
Sync-Files "docs" "docs" "*_EXAMPLE.md" "Doc examples (reference)"

# 5. Dev doc templates
Sync-Directory "dev_docs/templates" "Issue templates (ISSUE, PLAN, TASKS, CHANGES)"

# 6. Process instruction
Sync-File "INSTRUKCJA_PROCESU.md" "Process instruction"

# 7. Sync script itself
Sync-File "scripts/cursor-sync.ps1" "Sync script (self-update)"

# =====================
# ENSURE project.md exists (but don't overwrite)
# =====================
$projectRuleFile = Join-Path $PWD ".cursor/rules/project.md"
if (-not (Test-Path $projectRuleFile)) {
    Write-Step "Creating .cursor/rules/project.md (project-specific rules)"
    if (-not $DryRun) {
        $projectRuleSrc = Join-Path $Source ".cursor/rules/project.md"
        if (Test-Path $projectRuleSrc) {
            Copy-Item $projectRuleSrc -Destination $projectRuleFile -Force
        }
    }
} else {
    Write-Skip "project.md already exists (not overwriting)"
}

# =====================
# SUMMARY
# =====================
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Files copied:  $copied" -ForegroundColor Green
Write-Host "  Files skipped: $skipped" -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  Mode: DRY RUN (no files were actually copied)" -ForegroundColor Magenta
}
Write-Host ""

# Check for orphaned .cursorrules
$oldCursorrules = Join-Path $PWD ".cursorrules"
if (Test-Path $oldCursorrules) {
    Write-Host "  [WARNING] Old .cursorrules file found!" -ForegroundColor Yellow
    Write-Host "  Rules are now in .cursor/rules/*.md (modular)." -ForegroundColor Yellow
    Write-Host "  You can safely delete .cursorrules." -ForegroundColor Yellow
    Write-Host ""
}

Write-Done "Sync complete!"
