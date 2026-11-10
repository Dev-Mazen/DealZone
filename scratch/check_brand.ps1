Add-Type -AssemblyName System.Drawing
$file1 = Join-Path (Get-Location) "frontend\public\brand-identity.jpeg"
$bmp = New-Object System.Drawing.Bitmap($file1)
Write-Host "Brand identity dimensions: $($bmp.Width) x $($bmp.Height)"
$bmp.Dispose()

