Add-Type -AssemblyName System.Drawing
$file1 = Join-Path (Get-Location) "Materials\logo without background.png"
$bmp1 = New-Object System.Drawing.Bitmap($file1)
Write-Host "logo without background.png: $($bmp1.Width) x $($bmp1.Height)"
$p1 = $bmp1.GetPixel(0, 0)
Write-Host "Top-left: A=$($p1.A) R=$($p1.R) G=$($p1.G) B=$($p1.B)"

# Check center
$pCenter = $bmp1.GetPixel([int]($bmp1.Width / 2), [int]($bmp1.Height / 2))
Write-Host "Center: A=$($pCenter.A) R=$($pCenter.R) G=$($pCenter.G) B=$($pCenter.B)"
$bmp1.Dispose()

