# ==== KONFIGURATION ====
$processName     = "ReFlex.TrackingServer"                          # Name des Prozesses
$processPath     = "$env:LOCALAPPDATA\Programs\reflex.trackingserver\ReFlex TrackingServer.exe"  # Pfad zur EXE-Datei
$intervalSeconds = 1                                                # Abfrageintervall in Sekunden
$durationMinutes = 1                                               # Gesamtdauer in Minuten
$outputFile      = "process_perf_log.json"                          # Ausgabe-JSON-Datei

# ==== HILFSFUNKTIONEN ====

function Get-InstanceName($procName, $timeoutSeconds = 10) {
    $process_id = (Get-Process -Name $procName -ErrorAction SilentlyContinue).Id
    if (-not $process_id) { return $null }

    $endTime = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $endTime) {
        $counters = (Get-Counter '\Prozess(*)\Prozesskennung').CounterSamples
        foreach ($c in $counters) {
            if ($c.CookedValue -eq $process_id) {
                return $c.InstanceName
            }
        }
        Start-Sleep -Milliseconds 500
    }
    return $null
}

function Get-ProcessMetrics($instance) {
    $timestamp = Get-Date -Format "s"
    $counterPaths = @(
        "\Prozess($instance)\Prozessorzeit (%)",
        "\Prozess($instance)\Arbeitsseiten - privat",
        "\Prozess($instance)\Virtuelle Größe",
        "\Prozess($instance)\Virtuelle Bytes (max.)",
        "\Prozess($instance)\Private Bytes",
        "\Prozess($instance)\Threadanzahl",
        "\Prozess($instance)\Handleanzahl",
        "\Prozess($instance)\E/A-Lesevorgänge/s",
        "\Prozess($instance)\E/A-Schreibvorgänge/s",
        "\Prozess($instance)\E/A-Datenvorgänge/s",
        "\Prozess($instance)\E/A-Bytes gelesen/s",
        "\Prozess($instance)\E/A-Bytes geschrieben/s",
        "\Prozess($instance)\E/A-Datenbytes/s"
    )
    $samples = Get-Counter -Counter $counterPaths
    $values = @{}
    foreach ($sample in $samples.CounterSamples) {
        $name = $sample.Path.Split('\')[-1]
        $values[$name] = $sample.CookedValue
    }

    return [PSCustomObject]@{
        Timestamp               = $timestamp
        CPU_UsagePercent        = [math]::Round($values["Prozessorzeit (%)"], 2)
        Memory_Private_Pages_MB = [math]::Round($values["Arbeitsseiten - privat"] / 1MB, 2)
        Memory_Virtual_MB       = [math]::Round($values["Virtuelle Größe"] / 1MB, 2)
        Memory_Virtual_MB_max   = [math]::Round($values["Virtuelle Bytes (max.)"] / 1MB, 2)
        Memory_Private_MB       = [math]::Round($values["Private Bytes"] / 1MB, 2)
        Threads                 = [math]::Round($values["Threadanzahl"])
        Handles                 = [math]::Round($values["Handleanzahl"])
        EA_ReadNum_s            = [math]::Round($values["E/A-Lesevorgänge/s"])
        EA_WriteNum_s           = [math]::Round($values["E/A-Schreibvorgänge/s"])
        EA_DataNum_s            = [math]::Round($values["E/A-Datenvorgänge/s"])
        EA_ReadCount_s          = [math]::Round($values["E/A-Bytes gelesen/"])
        EA_WriteCount_s         = [math]::Round($values["E/A-Bytes geschrieben/s"])
        EA_DataCount_s          = [math]::Round($values["E/A-Datenbytes/s"])


    }
}

# ==== STARTPROZESS BEI BEDARF ====

$existing = Get-Process -Name $processName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "Prozess '$processName' wird gestartet ..."
    try {
        Start-Process -FilePath $processPath -ErrorAction Stop
        Start-Sleep -Seconds 2
    } catch {
        Write-Error "Fehler beim Starten von '$processPath'. Beende Skript."
        exit
    }
}

# ==== INSTANCE-NAME ERMITTELN ====
$instanceName = Get-InstanceName -procName $processName
if (-not $instanceName) {
    Write-Error "Konnte keine Performance-Counter-Instanz fÃ¼r '$processName' ermitteln."
    exit
}

# ==== MONITORING START ====
Write-Host "Monitoring von '$processName' gestartet (Instanz: '$instanceName')..."
$logData = @()
$endTime = (Get-Date).AddMinutes($durationMinutes)

while ((Get-Date) -lt $endTime) {
    $entry = Get-ProcessMetrics -instance $instanceName
    if ($entry) {
        $logData += $entry
    }
    Start-Sleep -Seconds $intervalSeconds
}

# ==== EXPORT ====
$logData | ConvertTo-Json -Depth 3 | Out-File -Encoding UTF8 $outputFile
Write-Host "Monitoring abgeschlossen. Ergebnisse gespeichert in '$outputFile'."
