Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\pibey\.gemini\antigravity-cli\brain\17c4097f-7a33-486c-b62d-8b274e90715a\credipresta_real_feature_graphic_1788278757675.jpg"
$destPath = "C:\Users\pibey\Documents\Prestalo\feature_graphic_1024x500.png"
$publicPath = "C:\Users\pibey\Documents\Prestalo\public\feature_graphic.png"

$srcImage = [System.Drawing.Image]::FromFile($sourcePath)
$destImage = New-Object System.Drawing.Bitmap 1024, 500
$graphics = [System.Drawing.Graphics]::FromImage($destImage)

$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$graphics.DrawImage($srcImage, 0, 0, 1024, 500)
$destImage.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$destImage.Save($publicPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$destImage.Dispose()
$srcImage.Dispose()

Write-Host "SUCCESS: feature_graphic_1024x500.png created at $destPath"
