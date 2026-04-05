param(
  [string]$Target = "."
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcCli = Join-Path $repoRoot "src\cli\index.ts"
$distCli = Join-Path $repoRoot "dist\cli\index.js"

if (Test-Path $srcCli -PathType Leaf) {
  & npx tsx $srcCli setup --target $Target
  exit $LASTEXITCODE
}

if (Test-Path $distCli -PathType Leaf) {
  & node $distCli setup --target $Target
  exit $LASTEXITCODE
}

throw "No setup entrypoint found. Expected src\\cli\\index.ts or dist\\cli\\index.js."
