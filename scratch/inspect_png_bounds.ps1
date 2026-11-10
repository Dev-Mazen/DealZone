Add-Type -AssemblyName System.Drawing
$file1 = Join-Path (Get-Location) "Materials\logo without background.png"
$bmp1 = New-Object System.Drawing.Bitmap($file1)
$minX = $bmp1.Width; $maxX = 0; $minY = $bmp1.Height; $maxY = 0
$opaqueCount = 0

for ($y = 0; $y -lt $bmp1.Height; $y++) {
    for ($x = 0; $x -lt $bmp1.Width; $x++) {
        $p = $bmp1.GetPixel($x, $y)
        if ($p.A -gt 20) {
            $opaqueCount++
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "logo without background.png non-transparent pixels: $opaqueCount"
Write-Host "Bounds: minX=$minX, minY=$minY, maxX=$maxX, maxY=$maxY"
Write-Host "Dimensions: $($maxX - $minX + 1) x $($maxY - $minY + 1)"

$colorSamples = @{}
for ($y = $minY; $y -le $maxY; $y += 5) {
    for ($x = $minX; $x -le $maxX; $x += 5) {
        $p = $bmp1.GetPixel($x, $y)
        if ($p.A -gt 100) {
            $hex = "#{0:X2}{1:X2}{2:X2}" -f ([int]($p.R/16)*16), ([int]($p.G/16)*16), ([int]($p.B/16)*16)
            if (-not $colorSamples.ContainsKey($hex)) { $colorSamples[$hex] = 0 }
            $colorSamples[$hex]++
        }
    }
}
$colorSamples.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value)"
}
$bmp1.Dispose()

