Add-Type -AssemblyName System.Drawing
$filePath = Join-Path (Get-Location) "frontend\src\assets\logo.jpeg"
$bmp = New-Object System.Drawing.Bitmap($filePath)

$bg = $bmp.GetPixel(0, 0)
Write-Host "Sampling inside bounds 196,264 to 884,780:"
$nonBg = 0; $white = 0; $cyan = 0; $blue = 0
for ($y = 264; $y -le 780; $y += 10) {
    for ($x = 196; $x -le 884; $x += 10) {
        $p = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($p.R - $bg.R) + [Math]::Abs($p.G - $bg.G) + [Math]::Abs($p.B - $bg.B)
        if ($diff -gt 60) {
            $nonBg++
            if ($p.R -gt 200 -and $p.G -gt 200 -and $p.B -gt 200) { $white++ }
            elseif ($p.B -gt 180 -and $p.G -gt 150) { $cyan++ }
            elseif ($p.B -gt 140 -and $p.G -lt 140) { $blue++ }
        }
    }
}
Write-Host "Non-background points: $nonBg (White: $white, Cyan: $cyan, Blue: $blue)"
$bmp.Dispose()

