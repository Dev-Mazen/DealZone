Add-Type -AssemblyName System.Drawing
$filePath = Join-Path (Get-Location) "frontend\src\assets\logo.jpeg"
$bmp = New-Object System.Drawing.Bitmap($filePath)
$bg = $bmp.GetPixel(0, 0)
Write-Host "Background color: R=$($bg.R) G=$($bg.G) B=$($bg.B)"

$minX = $bmp.Width; $maxX = 0; $minY = $bmp.Height; $maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y += 4) {
    for ($x = 0; $x -lt $bmp.Width; $x += 4) {
        $p = $bmp.GetPixel($x, $y)
        # distance from bg
        $diff = [Math]::Abs($p.R - $bg.R) + [Math]::Abs($p.G - $bg.G) + [Math]::Abs($p.B - $bg.B)
        if ($diff -gt 45) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Logo mark bounds: minX=$minX, minY=$minY, maxX=$maxX, maxY=$maxY"
Write-Host "Width = $($maxX - $minX), Height = $($maxY - $minY)"
$bmp.Dispose()

