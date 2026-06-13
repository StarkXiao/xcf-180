$ErrorActionPreference = "Stop"
$partsDir = "d:\solo\6.6\xcf-180\backend\public\images\parts"
$partsJson = Get-Content "d:\solo\6.6\xcf-180\backend\data\parts.json" -Raw -Encoding UTF8 | ConvertFrom-Json

$categoryPrompts = @{
    "exhaust"    = "motorcycle exhaust pipe titanium alloy, product photo, dark studio background, professional lighting"
    "wheels"     = "motorcycle wheel rim forged aluminum, product photo, dark studio background, professional lighting"
    "handlebar"  = "motorcycle handlebar aluminum alloy, product photo, dark studio background, professional lighting"
    "lighting"   = "motorcycle LED headlight assembly, product photo, dark studio background, professional lighting"
    "bodykit"    = "motorcycle carbon fiber fairing body kit, product photo, dark studio background, professional lighting"
    "brake"      = "motorcycle brake caliper disc, product photo, dark studio background, professional lighting"
}

$successCount = 0
$failCount = 0

foreach ($part in $partsJson.parts) {
    $fileName = "$($part.id).png"
    $filePath = Join-Path $partsDir $fileName

    if (Test-Path $filePath) {
        $fileInfo = Get-Item $filePath
        if ($fileInfo.Length -gt 1000) {
            Write-Host "[SKIP] $fileName 已存在" -ForegroundColor Gray
            $successCount++
            continue
        }
    }

    $basePrompt = $categoryPrompts[$part.categoryId]
    $fullPrompt = "$($part.name), $basePrompt, $($part.description)"
    $encodedPrompt = [System.Uri]::EscapeDataString($fullPrompt)
    $url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=$encodedPrompt&image_size=square"

    try {
        Write-Host "[DOWN] $fileName ..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $filePath -TimeoutSec 60 -UseBasicParsing
        $size = (Get-Item $filePath).Length
        if ($size -gt 1000) {
            Write-Host " OK ($([math]::Round($size/1024, 1)) KB)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " FAIL (文件过小: $size bytes)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  图片生成完成"
Write-Host "  成功: $successCount  失败: $failCount"
Write-Host "========================================"
