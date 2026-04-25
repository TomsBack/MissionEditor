# Downloads msedgedriver matching the installed WebView2 runtime version into
# webdriver/.bin/. Run this once after a fresh checkout, and again whenever
# WebView2 auto-updates and the existing driver starts throwing
# "session not created" at session start.
#
# Usage:
#   pwsh -File webdriver/setup-driver.ps1
#   # or from the webdriver/ directory:
#   pwsh -File setup-driver.ps1

$ErrorActionPreference = 'Stop'

# Locate the highest-numbered version subfolder under WebView2's install dir.
$webview2 = Get-ChildItem 'C:\Program Files (x86)\Microsoft\EdgeWebView\Application' `
    -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
    Sort-Object { [version]$_.Name } -Descending |
    Select-Object -First 1

if (-not $webview2) {
    throw 'Could not locate WebView2. Install Edge / WebView2 Runtime first.'
}
$version = $webview2.Name
Write-Host "Detected WebView2 $version"

# webdriver/.bin/ relative to this script's location.
$binDir = Join-Path $PSScriptRoot '.bin'
New-Item -ItemType Directory -Force -Path $binDir | Out-Null
$zip = Join-Path $binDir 'edgedriver.zip'

# msedgedriver.azureedge.net was retired; microsoft.com is the canonical host.
# Try azureedge as a fallback in case the user is behind a proxy that knows it.
$urls = @(
    "https://msedgedriver.microsoft.com/$version/edgedriver_win64.zip",
    "https://msedgedriver.azureedge.net/$version/edgedriver_win64.zip"
)

$ok = $false
foreach ($url in $urls) {
    try {
        Write-Host "Downloading $url"
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
        $ok = $true
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)"
    }
}

if (-not $ok) {
    throw "Could not download msedgedriver for $version from any host."
}

Expand-Archive -Path $zip -DestinationPath $binDir -Force
Remove-Item $zip

$driver = Join-Path $binDir 'msedgedriver.exe'
if (Test-Path $driver) {
    Write-Host "OK: $driver"
} else {
    throw "Expected $driver after extraction but it isn't there."
}
