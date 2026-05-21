# Sync course HTML into learn/llm-agent/
# Usage: .\scripts\sync-learn-course.ps1
# Config: scripts\sync.config.json (copy from sync.config.example.json)

param(
    [string]$Source = "",
    [string]$Dest = (Join-Path $PSScriptRoot "..\learn\llm-agent")
)

function Find-CourseSource {
    $configPath = Join-Path $PSScriptRoot "sync.config.json"
    if (Test-Path -LiteralPath $configPath) {
        try {
            $cfg = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($cfg.source -and (Test-Path -LiteralPath $cfg.source)) {
                return (Resolve-Path -LiteralPath $cfg.source).Path
            }
            Write-Warning "sync.config.json source not found: $($cfg.source)"
        } catch {
            Write-Warning "Failed to read sync.config.json: $_"
        }
    }

    $desktop = [Environment]::GetFolderPath("Desktop")
    if (Test-Path -LiteralPath $desktop) {
        Get-ChildItem -LiteralPath $desktop -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $candidate = Join-Path $_.FullName "course\llm-agent"
            $hub = Join-Path $candidate "present-hub.html"
            if (Test-Path -LiteralPath $hub) {
                return (Resolve-Path -LiteralPath $candidate).Path
            }
        }
    }

    return $null
}

if (-not $Source) {
    $Source = Find-CourseSource
}

if (-not $Source -or -not (Test-Path -LiteralPath $Source)) {
    Write-Host ""
    Write-Host "ERROR: Course source folder not found." -ForegroundColor Red
    Write-Host "Fix: copy scripts\sync.config.example.json -> scripts\sync.config.json"
    Write-Host "      and set ""source"" to your course\llm-agent path (use forward slashes)."
    Write-Host ""
    exit 1
}

Write-Host "Source: $Source"
Write-Host "Dest:   $Dest"

New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$patterns = @("course-*.html", "present-hub.html", "cheat-sheet.md")
$count = 0
foreach ($pat in $patterns) {
    Get-ChildItem -LiteralPath $Source -Filter $pat -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Dest -Force
        $count++
        Write-Host "Copied $($_.Name)"
    }
}

$hub = Join-Path $Dest "present-hub.html"
if (Test-Path -LiteralPath $hub) {
    $html = Get-Content -LiteralPath $hub -Raw -Encoding UTF8
    # HTML entities avoid PowerShell/console encoding corrupting Chinese on Windows
    if ($html -notmatch 'href="../../notes.html"') {
        if ($html -notmatch '\.back \{') {
            $html = $html -replace '(</style>)', @'
  .back { display:inline-block; margin-bottom:20px; font-size:.9rem; color:#0369a1; text-decoration:none; }
  .back:hover { text-decoration:underline; }
$1
'@
        }
        $html = $html -replace '(<div class="wrap">)', @'
$1
  <a class="back" href="../../notes.html">&larr; &#36820;&#22238; Vienne.AI &#23398;&#20064;&#31508;&#35760;</a>
  <a class="back" href="../../index.html#learning" style="margin-left:16px">&#20027;&#39029;</a>
'@
        [System.IO.File]::WriteAllText($hub, $html, [System.Text.UTF8Encoding]::new($false))
        Write-Host "Patched present-hub.html back links"
    }
}

Write-Host ""
Write-Host "Done. $count files synced." -ForegroundColor Green
Write-Host "Next:"
Write-Host "  git add learn notes.html index.html"
Write-Host "  git commit -m ""update: refresh llm-agent course"""
Write-Host "  git push origin main"
