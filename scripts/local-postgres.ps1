<#
.SYNOPSIS
  Starts, stops or checks the local development PostgreSQL instance.

.DESCRIPTION
  This project was set up on a machine with neither Docker nor a system-wide
  PostgreSQL service, so development uses a portable PostgreSQL installation
  that runs entirely from a user directory and needs no administrator rights.

  It lives outside the repository (by default ~/.olympiad-postgres) so the
  project directory holds only the application.

  Any other PostgreSQL will do just as well: point DATABASE_URL at it and
  ignore this script.

.PARAMETER Action
  start | stop | status | psql

.EXAMPLE
  ./scripts/local-postgres.ps1 start
  ./scripts/local-postgres.ps1 status
#>
param(
  [Parameter(Position = 0)]
  [ValidateSet("start", "stop", "status", "psql", "restart")]
  [string]$Action = "status"
)

$ErrorActionPreference = "Stop"

# Override with $env:OLYMPIAD_PG_HOME if the instance lives somewhere else.
$PgHome = if ($env:OLYMPIAD_PG_HOME) { $env:OLYMPIAD_PG_HOME } else { Join-Path $HOME ".olympiad-postgres" }
$PgBin = Join-Path $PgHome "pgsql\bin"
$PgData = Join-Path $PgHome "pgdata"
$LogFile = Join-Path $PgHome "postgres.log"
$Port = if ($env:OLYMPIAD_PG_PORT) { $env:OLYMPIAD_PG_PORT } else { "5432" }

if (-not (Test-Path $PgBin)) {
  Write-Error "No PostgreSQL found at $PgHome. Set OLYMPIAD_PG_HOME, or point DATABASE_URL at any other PostgreSQL instance."
  exit 1
}

$PgCtl = Join-Path $PgBin "pg_ctl.exe"
$Psql = Join-Path $PgBin "psql.exe"

switch ($Action) {
  "start" {
    Write-Host "Starting PostgreSQL on port $Port ..."
    & $PgCtl -D $PgData -l $LogFile -o "-p $Port" start
    Start-Sleep -Seconds 2
    & $PgCtl -D $PgData status
  }
  "stop" {
    Write-Host "Stopping PostgreSQL ..."
    & $PgCtl -D $PgData -m fast stop
  }
  "restart" {
    & $PgCtl -D $PgData -m fast stop
    Start-Sleep -Seconds 1
    & $PgCtl -D $PgData -l $LogFile -o "-p $Port" start
  }
  "status" {
    & $PgCtl -D $PgData status
  }
  "psql" {
    & $Psql -h 127.0.0.1 -p $Port -U postgres -d olympiad
  }
}
