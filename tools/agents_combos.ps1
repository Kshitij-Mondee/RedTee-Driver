# One video per model combination through the API agents (D-115), outside Cowork. PowerShell, from Video-Engine:
#   .\tools\agents_combos.ps1                      # all four two-key combinations
#   .\tools\agents_combos.ps1 -Profiles openai-balanced
# Same behaviour as tools/agents_combos.sh (read its header).
param(
  [string[]]$Profiles = @("claude-balanced", "openai-balanced", "claude-openai-value", "two-key-budget"),
  [string]$Topic = "How to end a meeting with clear decisions, owners and dates",
  [string]$Audience = "corporate employees who run or attend team meetings",
  [string]$Style = "corporate-clean",
  [double]$Length = 2,
  [double]$Budget = 9,
  [string]$Approver = "Kshitij, unattended combo run"
)
py -m loom agents doctor --profiles ($Profiles -join ",")
if ($LASTEXITCODE -ne 0) { Write-Host "doctor failed: fix the model ids first"; exit 1 }
foreach ($P in $Profiles) {
  $Id = "combo-$P"
  Write-Host "`n=== $P -> projects/$Id"
  if (-not (Test-Path "projects/$Id")) {
    py -m loom new $Id --topic $Topic --audience $Audience --genre explainer --length $Length --style $Style --persona analyst --avatar none --mix cinema
  }
  py -m loom agents run $Id --profile $P --until render --budget $Budget --approve-knowledge-as $Approver
  Write-Host "exit $LASTEXITCODE for $P"
  py -m loom agents report $Id
}
Write-Host "`nVideos: projects/combo-*/renders/*.mp4"
