# Loom setup for Windows (PowerShell).  Run from the Video-Engine folder:  ./setup.ps1
$ErrorActionPreference = "Stop"
Write-Host "== node packages"; npm install --no-audit --no-fund
Write-Host "== python packages"; py -m pip install -r requirements.txt
Write-Host "== voice model (Kokoro, local)"; py -m loom setup voice
Write-Host "== render browser (HyperFrames managed Chrome)"; npx hyperframes browser ensure
Write-Host "== template catalog"; py -m loom catalog
Write-Host "== doctor"; py -m loom doctor
