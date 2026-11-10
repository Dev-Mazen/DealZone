Add-Type -AssemblyName System.Drawing
$filePath = Join-Path (Get-Location) "frontend\src\assets\logo.jpeg"
$bmp = New-Object System.Drawing.Bitmap($filePath)
Write-Host "Dimensions: $($bmp.Width) x $($bmp.Height)"
$p0 = $bmp.GetPixel(0, 0)
$pCenter = $bmp.GetPixel([int]($bmp.Width / 2), [int]($bmp.Height / 2))
Write-Host "Top-left: R=$($p0.R) G=$($p0.G) B=$($p0.B)"
Write-Host "Center: R=$($pCenter.R) G=$($pCenter.G) B=$($pCenter.B)"
$bmp.Dispose()

