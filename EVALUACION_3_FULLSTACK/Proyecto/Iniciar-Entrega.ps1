$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path -LiteralPath '.env.entrega')) {
    function New-Key {
        $bytes = New-Object byte[] 32
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        [Convert]::ToBase64String($bytes)
    }
    $adminKey = New-Key
    @("APP_DOCKERFILE=deploy/Dockerfile.runtime", "ADMIN_PASSWORD=$adminKey", "DB_PASSWORD=$(New-Key)", "MYSQL_ROOT_PASSWORD=$(New-Key)", "JWT_SECRET=$(New-Key)") | Set-Content -LiteralPath '.env.entrega' -Encoding ASCII
    @("Administrador local: admin@gmail.com", "Clave: $adminKey", "Solo para esta instalación. No publicar este archivo.") | Set-Content -LiteralPath 'ACCESO-LOCAL.txt' -Encoding UTF8
}
docker compose --env-file .env.entrega -f compose.entrega.yaml up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Docker no pudo iniciar. Compruebe Docker Desktop con contenedores Linux.' }
Write-Host 'Página: http://localhost:8080'
Write-Host 'Swagger: http://localhost:8080/swagger-ui/index.html'
Write-Host 'Espere el arranque de Java. La clave local está en ACCESO-LOCAL.txt.'
