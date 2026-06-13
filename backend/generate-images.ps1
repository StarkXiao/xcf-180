$ErrorActionPreference = "Stop"

$partsJson = Get-Content "data/parts.json" | ConvertFrom-Json
$parts = $partsJson.parts
$total = $parts.Count
$current = 0

Write-Host "========================================"
Write-Host "  正在生成 $total 张配件图片"
Write-Host "========================================"
Write-Host ""

foreach ($part in $parts) {
    $current++
    $imagePath = "public$($part.image)"
    $fileName = Split-Path $imagePath -Leaf
    $dir = Split-Path $imagePath -Parent

    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    if (Test-Path $imagePath) {
        Write-Host "[$current/$total] 跳过 - $($part.name) 已存在"
        continue
    }

    $prompt = "motorcycle $($part.categoryId) part $($part.name), $($part.description), product photo, dark studio background, professional lighting, high detail, 4k"
    $encodedPrompt = [System.Uri]::EscapeDataString($prompt)
    $url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=$encodedPrompt&image_size=square_hd"

    try {
        Write-Host "[$current/$total] 正在生成 - $($part.name)..."
        Invoke-WebRequest -Uri $url -OutFile $imagePath -TimeoutSec 60
        Write-Host "[$current/$total] ✓ 完成 - $fileName"
    } catch {
        Write-Host "[$current/$total] ✗ 失败 - $($_.Exception.Message)"
    }

    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================"
Write-Host "  图片生成完成！"
Write-Host "========================================"
