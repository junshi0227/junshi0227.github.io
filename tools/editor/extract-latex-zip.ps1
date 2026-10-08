param(
    [Parameter(Mandatory = $true)][string]$InputPath,
    [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [IO.Path]::GetFullPath($OutputPath).TrimEnd('\')
[IO.Directory]::CreateDirectory($root) | Out-Null
$archive = [IO.Compression.ZipFile]::OpenRead($InputPath)
try {
    if ($archive.Entries.Count -gt 1000) { throw 'Archive contains too many files (max 1000).' }
    $total = [long]0
    foreach ($entry in $archive.Entries) {
        $name = $entry.FullName.Replace('/', '\')
        if ([IO.Path]::IsPathRooted($name) -or $name.Contains(':')) { throw 'Archive contains an invalid path.' }
        $target = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $name))
        if (-not $target.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Archive contains a path outside the destination.' }
        if ($entry.Name -eq '') { [IO.Directory]::CreateDirectory($target) | Out-Null; continue }
        $total += $entry.Length
        if ($entry.Length -gt 30MB -or $total -gt 100MB) { throw 'Archive is too large after extraction (max 100MB).' }
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
        $source = $entry.Open()
        $destination = [IO.File]::Create($target)
        try { $source.CopyTo($destination) } finally { $destination.Dispose(); $source.Dispose() }
    }
} finally {
    $archive.Dispose()
}
