param(
    [Parameter(Mandatory = $true)]
    [string] $CsvPath,

    [Parameter(Mandatory = $true)]
    [string] $PhotosDirectory,

    [string] $ApiBaseUrl = "http://localhost:5291",

    [switch] $Preview
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd("/")
$CsvPath = (Resolve-Path -LiteralPath $CsvPath).Path
$PhotosDirectory = (Resolve-Path -LiteralPath $PhotosDirectory).Path
$rows = @(Import-Csv -LiteralPath $CsvPath -Encoding utf8)

if ($rows.Count -eq 0) {
    throw "CSV has no rows to import."
}

$headers = @($rows[0].PSObject.Properties.Name)
foreach ($requiredHeader in @("Name", "Biography")) {
    if ($headers -notcontains $requiredHeader) {
        throw "Required CSV column missing: '$requiredHeader'."
    }
}

function Normalize-ArtistName([string] $Value) {
    $decomposed = $Value.Normalize([Text.NormalizationForm]::FormD)
    $withoutMarks = [regex]::Replace($decomposed, "\p{Mn}", "")
    return [regex]::Replace($withoutMarks.ToLowerInvariant(), "[^a-z0-9]", "")
}

function Find-ArtistPhoto($Row) {
    if ($headers -contains "PhotoFile" -and -not [string]::IsNullOrWhiteSpace($Row.PhotoFile)) {
        $candidate = Join-Path $PhotosDirectory $Row.PhotoFile.Trim()
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }

        # Match by filename stem when the CSV extension differs from the real image.
        $requestedStem = Normalize-ArtistName ([IO.Path]::GetFileNameWithoutExtension($Row.PhotoFile.Trim()))
        $matchByFileName = Get-ChildItem -LiteralPath $PhotosDirectory -File |
            Where-Object { (Normalize-ArtistName $_.BaseName) -eq $requestedStem } |
            Select-Object -First 1
        if ($matchByFileName) { return $matchByFileName.FullName }
    }

    $expected = Normalize-ArtistName $Row.Name
    $match = Get-ChildItem -LiteralPath $PhotosDirectory -File |
        Where-Object { (Normalize-ArtistName $_.BaseName) -eq $expected } |
        Select-Object -First 1
    if ($match) { return $match.FullName }
    return $null
}

$prepared = foreach ($row in $rows) {
    if ([string]::IsNullOrWhiteSpace($row.Name)) {
        throw "Each CSV row must include an artist name."
    }
    [pscustomobject]@{
        Name = $row.Name.Trim()
        Biography = if ($row.Biography) { $row.Biography.Trim() } else { "" }
        PhotoPath = Find-ArtistPhoto $row
    }
}

if ($Preview) {
    $prepared | Select-Object Name, Biography, @{ Name = "Photo"; Expression = { if ($_.PhotoPath) { Split-Path $_.PhotoPath -Leaf } else { "(sem foto correspondente)" } } } | Format-Table -AutoSize
    Write-Host "Preview complete. No changes were sent."
    return
}

$credential = Get-Credential -Message "Entre com uma conta administradora do ViSah"
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $loginBody = @{ email = $credential.UserName; password = $plainPassword } | ConvertTo-Json -Compress
    $session = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $plainPassword = $null
    $loginBody = $null
}

$headersAuth = @{ Authorization = "Bearer $($session.token)" }
$existingArtists = @(Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/artists" -Headers $headersAuth)
$byName = @{}
foreach ($artist in $existingArtists) {
    $byName[(Normalize-ArtistName $artist.name)] = $artist
}

$createdCount = 0
$updatedCount = 0
$photoCount = 0
$errors = [System.Collections.Generic.List[string]]::new()

foreach ($artistRow in $prepared) {
    try {
        $key = Normalize-ArtistName $artistRow.Name
        $existing = $byName[$key]
        $body = @{
            name = $artistRow.Name
            biography = $artistRow.Biography
            photoUrl = if ($existing) { $existing.photoUrl } else { $null }
        } | ConvertTo-Json -Compress

        if ($existing) {
            Invoke-RestMethod -Method Put -Uri "$ApiBaseUrl/api/artists/$($existing.id)" -Headers $headersAuth -ContentType "application/json" -Body $body | Out-Null
            $artistId = $existing.id
            $updatedCount++
        }
        else {
            $created = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/api/artists" -Headers $headersAuth -ContentType "application/json" -Body $body
            $artistId = $created.id
            $createdCount++
        }

        if ($artistRow.PhotoPath) {
            $image = Get-Item -LiteralPath $artistRow.PhotoPath
            Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/api/artists/$artistId/photo" -Headers $headersAuth -Form @{ image = $image } | Out-Null
            $photoCount++
        }
        else {
            Write-Warning "No matching image for '$($artistRow.Name)'; artist saved without changing its photo."
        }
    }
    catch {
        $errors.Add("$($artistRow.Name): $($_.Exception.Message)")
    }
}

Write-Host ""
Write-Host "Import complete: $createdCount created, $updatedCount updated, $photoCount photos uploaded."
if ($errors.Count -gt 0) {
    Write-Warning "$($errors.Count) row(s) failed:"
    $errors | ForEach-Object { Write-Warning $_ }
}
