param(
    [Parameter(Mandatory = $true)][string]$InputPath,
    [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$word = $null
$document = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.AutomationSecurity = 3
    $document = $word.Documents.Open($InputPath, $false, $true, $false)
    try {
        $document.ExportAsFixedFormat([IO.Path]::ChangeExtension($OutputPath, '.pdf'), 17)
    } catch {
        # HTML import can still proceed when PDF export is unavailable.
    }
    $document.WebOptions.Encoding = 65001
    $document.SaveAs2($OutputPath, 10)
    if (-not (Test-Path -LiteralPath $OutputPath)) {
        throw 'Word did not create the HTML output.'
    }
} finally {
    if ($document) {
        $document.Close(0)
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($document)
    }
    if ($word) {
        $word.Quit()
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)
    }
}
