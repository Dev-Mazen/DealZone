Add-Type -AssemblyName System.Drawing
$filePath = Join-Path (Get-Location) "frontend\src\assets\logo.jpeg"
$bmp = New-Object System.Drawing.Bitmap($filePath)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# Sample colors across grid
$colorMap = @{}
for ($y = 0; $y -lt $bmp.Height; $y += 30) {
    for ($x = 0; $x -lt $bmp.Width; $x += 30) {
        $p = $bmp.GetPixel($x, $y)
        $hex = "#{0:X2}{1:X2}{2:X2}" -f $p.R, $p.G, $p.B
        # Group similar colors
        $rGroup = [int]($p.R / 32) * 32
        $gGroup = [int]($p.G / 32) * 32
        $bGroup = [int]($p.B / 32) * 32
        $key = "#{0:X2}{1:X2}{2:X2}" -f $rGroup, $gGroup, $bGroup
        if (-not $colorMap.ContainsKey($key)) { $colorMap[$key] = 0 }
        $colorMap[$key]++
    }
}
$colorMap.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value)"
}
$bmp.Dispose()

