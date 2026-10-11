param(
  [string]$MasterPassword
)

$ErrorActionPreference = "Stop"

$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (-not (Test-Path $envFile)) {
  throw "Arquivo .env não encontrado na raiz do projeto."
}

$urlLine = Get-Content $envFile | Where-Object { $_ -match '^\s*VITE_SUPABASE_URL\s*=' } | Select-Object -First 1
if (-not $urlLine -or $urlLine -notmatch '^\s*VITE_SUPABASE_URL\s*=\s*(.+?)\s*$') {
  throw "VITE_SUPABASE_URL não está configurada no .env."
}

$supabaseUrl = $matches[1].Trim().Trim('"').Trim("'")
if ($supabaseUrl -notmatch '^https://[^/]+\.supabase\.co/?$') {
  throw "VITE_SUPABASE_URL não parece ser uma URL válida de projeto Supabase."
}

$secureKey = Read-Host "Cole a chave SERVICE_ROLE do Supabase (a entrada não será exibida)" -AsSecureString
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
  $env:SUPABASE_URL = $supabaseUrl
  $env:SUPABASE_SERVICE_ROLE_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
  $scriptPath = Join-Path $PSScriptRoot "set-master-admin.mjs"
  if ($MasterPassword) {
    node $scriptPath $MasterPassword
  } else {
    node $scriptPath
  }
  if ($LASTEXITCODE -ne 0) {
    throw "A atualização do papel Master falhou. Veja a mensagem acima."
  }
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
}
