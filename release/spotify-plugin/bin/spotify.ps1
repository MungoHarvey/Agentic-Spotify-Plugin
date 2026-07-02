$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Entry = Join-Path $ScriptDir "spotify.mjs"

& node $Entry @args
exit $LASTEXITCODE
