# Loads REGISTRY_TOKEN for @twelvelabs-io/react (GitHub Packages).
# Order: global ~/.cursor/secrets/.env.registry → repo-root .env.registry
# Usage (from repo root):  . .\scripts\load-registry-env.ps1

$globalFile = Join-Path $env:USERPROFILE ".cursor\secrets\.env.registry"
$repoFile = Join-Path (Join-Path $PSScriptRoot "..") ".env.registry"

$registryFile = $null
if (Test-Path $globalFile) {
  $registryFile = $globalFile
} elseif (Test-Path $repoFile) {
  $registryFile = $repoFile
}

if (-not $registryFile) {
  Write-Error @"
REGISTRY_TOKEN not found.
  Global (set once): $globalFile
  Or repo fallback:  $repoFile
  See .env.registry.example
"@
  return
}

Get-Content $registryFile | ForEach-Object {
  if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    if ($name -eq "REGISTRY_TOKEN" -and $value) {
      Set-Item -Path "env:REGISTRY_TOKEN" -Value $value
    }
  }
}

if (-not $env:REGISTRY_TOKEN) {
  Write-Error "REGISTRY_TOKEN is empty in $registryFile"
} else {
  $source = if ($registryFile -eq $globalFile) { "global" } else { "repo" }
  Write-Host "REGISTRY_TOKEN loaded ($source) for npm (GitHub Packages)."
}
