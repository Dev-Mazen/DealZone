Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path (Get-Location) "Materials\logo without background.png"
$src = New-Object System.Drawing.Bitmap($srcPath)

# Bounds were: minX=90, minY=122, maxX=411, maxY=361
# Let's add a small 6px padding
$pad = 6
$cropX = [Math]::Max(0, 90 - $pad)
$cropY = [Math]::Max(0, 122 - $pad)
$cropW = [Math]::Min($src.Width - $cropX, (411 - 90 + 1) + 2 * $pad)
$cropH = [Math]::Min($src.Height - $cropY, (361 - 122 + 1) + 2 * $pad)

Write-Host "Cropping: $cropX, $cropY, size: $cropW x $cropH"

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Save to frontend/src/assets and frontend/public
$dest1 = Join-Path (Get-Location) "frontend\src\assets\logo-mark.png"
$dest2 = Join-Path (Get-Location) "frontend\public\logo-mark.png"
$destTransparent = Join-Path (Get-Location) "frontend\src\assets\logo-transparent.png"
$destPublicTransparent = Join-Path (Get-Location) "frontend\public\images\logo-transparent.png"

$cropped.Save($dest1, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Save($destTransparent, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Save($destPublicTransparent, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Saved tightly cropped transparent logo: $($cropped.Width) x $($cropped.Height)"

# Also create a square favicon (e.g. 192x192 and 32x32)
$favSize = 192
$favBmp = New-Object System.Drawing.Bitmap($favSize, $favSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gFav = [System.Drawing.Graphics]::FromImage($favBmp)
$gFav.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
$gFav.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Scale cropped to fit square nicely with small margin
$scale = [Math]::Min(($favSize - 16) / $cropW, ($favSize - 16) / $cropH)
$wScaled = [int]($cropW * $scale)
$hScaled = [int]($cropH * $scale)
$xPos = [int](($favSize - $wScaled) / 2)
$yPos = [int](($favSize - $hScaled) / 2)

$gFav.DrawImage($cropped, $xPos, $yPos, $wScaled, $hScaled)
$gFav.Dispose()

$favPng = Join-Path (Get-Location) "frontend\public\favicon.png"
$favBmp.Save($favPng, [System.Drawing.Imaging.ImageFormat]::Png)

# 32x32 favicon
$fav32 = New-Object System.Drawing.Bitmap(32, 32, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g32 = [System.Drawing.Graphics]::FromImage($fav32)
$g32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$scale32 = [Math]::Min(30 / $cropW, 30 / $cropH)
$w32 = [int]($cropW * $scale32)
$h32 = [int]($cropH * $scale32)
$g32.DrawImage($cropped, [int]((32 - $w32) / 2), [int]((32 - $h32) / 2), $w32, $h32)
$g32.Dispose()

$favIco = Join-Path (Get-Location) "frontend\public\favicon.ico"
$icon = [System.Drawing.Icon]::FromHandle($fav32.GetHicon())
$fs = New-Object System.IO.FileStream($favIco, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

Write-Host "Created favicon.png and favicon.ico"

$src.Dispose()
$cropped.Dispose()
$favBmp.Dispose()
$fav32.Dispose()

