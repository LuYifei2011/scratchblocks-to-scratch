Write-Output "将 scratchblocks 代码转换为 Scratch 积木块 - 桌面版安装脚本"

# -----------------------------------------------------------------------
# 检测 app.asar 路径
#   在当前用户与所有用户的安装目录（64/32 位）下，
#   查找 <AppFolder>\resources\app.asar
# -----------------------------------------------------------------------
function Find-AppAsar {
    param([string[]] $FolderNames)   # 候选应用文件夹名

    $bases = @(
        "$env:LOCALAPPDATA\Programs",   # 当前用户安装（NSIS/Squirrel 默认位置）
        $env:ProgramFiles,              # 所有用户 64 位
        ${env:ProgramFiles(x86)}        # 所有用户 32 位
    )

    foreach ($base in $bases) {
        if (-not $base) { continue }
        foreach ($name in $FolderNames) {
            $asar = Join-Path $base "$name\resources\app.asar"
            if (Test-Path $asar) { return $asar }
        }
    }

    return $null
}

# -----------------------------------------------------------------------
# 检测 Scratch 3
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "正在检测 Scratch 3 安装位置..."
$scratchAsar = Find-AppAsar -FolderNames @("Scratch 3")

if ($scratchAsar) {
    Write-Output "  [找到] $scratchAsar"
} else {
    Write-Output "  [未找到] Scratch 3 未安装，或从 Microsoft Store 安装（无法修补）"
}

# -----------------------------------------------------------------------
# 检测 TurboWarp
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "正在检测 TurboWarp 安装位置..."
$turbowarpAsar = Find-AppAsar -FolderNames @("TurboWarp")

if ($turbowarpAsar) {
    Write-Output "  [找到] $turbowarpAsar"
} else {
    Write-Output "  [未找到] TurboWarp 未安装，或从 Microsoft Store 安装（无法修补）"
}

# -----------------------------------------------------------------------
# 若两者均未找到，则退出
# -----------------------------------------------------------------------
if (-not $scratchAsar -and -not $turbowarpAsar) {
    Write-Output ""
    Write-Error "未检测到任何可修补的应用程序，脚本终止。"
    exit 1
}

# -----------------------------------------------------------------------
# 用户选择要修补的应用
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "请选择要修补的应用："
$options = @()
$optIndex = 1

if ($scratchAsar) {
    $options += @{ Index = $optIndex; Name = "Scratch 3"; Path = $scratchAsar; Type = "scratch" }
    Write-Output "  $optIndex. Scratch 3 - $scratchAsar"
    $optIndex++
}

if ($turbowarpAsar) {
    $options += @{ Index = $optIndex; Name = "TurboWarp"; Path = $turbowarpAsar; Type = "turbowarp" }
    Write-Output "  $optIndex. TurboWarp - $turbowarpAsar"
    $optIndex++
}

Write-Output "  $optIndex. 退出"

$choice = Read-Host "请输入序号"
if ([int]$choice -eq $optIndex) {
    Write-Output "已退出。"
    exit 0
}

$selected = $options | Where-Object { $_.Index -eq [int]$choice }
if (-not $selected) {
    Write-Error "无效的选择，脚本终止。"
    exit 1
}

$targetAsar = $selected.Path
$appType = $selected.Type
$appName = $selected.Name

Write-Output ""
Write-Output "您选择了：$appName"

# -----------------------------------------------------------------------
# 选择操作：修补或还原
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "请选择操作："
Write-Output "  1. 修补（安装脚本）"
Write-Output "  2. 还原（移除脚本）"
Write-Output "  3. 取消"

$action = Read-Host "请输入序号"

if ($action -eq "3") {
    Write-Output "已取消。"
    exit 0
}

if ($action -ne "1" -and $action -ne "2") {
    Write-Error "无效的选择，脚本终止。"
    exit 1
}

# -----------------------------------------------------------------------
# 工作目录
# -----------------------------------------------------------------------
$workDir = "$env:TEMP\sb2s"
$extractDir = Join-Path $workDir "app_extracted"
$asarPath = Join-Path $workDir "asar.exe"
$scriptUrl = "https://luyifei2011.github.io/scratchblocks-to-scratch/scratchblocks-to-scratch.user.js"
$scriptName = "scratchblocks-to-scratch.user.js"

# -----------------------------------------------------------------------
# 下载 asar 工具
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "正在下载 asar 工具..."
New-Item -ItemType Directory -Path $workDir -Force | Out-Null
Invoke-WebRequest -Uri "https://github.com/mykeels/asar-binaries/raw/refs/heads/master/bin/asar-win.exe" `
    -OutFile $asarPath -UseBasicParsing -ErrorAction Stop
Write-Output "  [成功]"

# -----------------------------------------------------------------------
# 备份原 app.asar
# -----------------------------------------------------------------------
$asarBackup = "$targetAsar.backup"
if (-not (Test-Path $asarBackup)) {
    Write-Output ""
    Write-Output "正在备份原文件..."
    Copy-Item -Path $targetAsar -Destination $asarBackup -ErrorAction Stop
    Write-Output "  [成功] $asarBackup"
} else {
    Write-Output ""
    Write-Output "  [备份已存在] $asarBackup"
}

# -----------------------------------------------------------------------
# 清理并解压 asar
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "正在解压 asar..."
if (Test-Path $extractDir) {
    Remove-Item -Path $extractDir -Recurse -Force -ErrorAction SilentlyContinue
}

& $asarPath extract $targetAsar $extractDir
if ($LASTEXITCODE -ne 0) {
    Write-Error "解压失败，脚本终止。"
    exit 1
}
Write-Output "  [成功]"

# -----------------------------------------------------------------------
# 处理修补操作
# -----------------------------------------------------------------------
if ($action -eq "1") {
    # ===== 修补逻辑 =====
    Write-Output ""
    Write-Output "正在下载脚本..."
    $scriptPath = Join-Path $workDir $scriptName
    Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath -UseBasicParsing -ErrorAction Stop
    Write-Output "  [成功] $scriptPath"

    # 读取脚本内容
    $scriptContent = Get-Content -Path $scriptPath -Raw -Encoding UTF8
    
    # 在脚本头部添加 GM_addStyle 函数
    $gmAddStyle = @"
window.GM_addStyle = function (style) {
	console.log('gm_addstyle')
};
"@
    
    if ($scriptContent -notmatch "window\\.GM_addStyle") {
        $scriptContent = $gmAddStyle + "`r`n" + $scriptContent
    }

    # 如果是 TurboWarp，添加标志
    if ($appType -eq "turbowarp") {
        $twFlag = "window.__SB2S_DESKTOP_TURBOWARP__ = true;`r`n"
        if ($scriptContent -notmatch "window\\.__SB2S_DESKTOP_TURBOWARP__") {
            $scriptContent = $twFlag + $scriptContent
        }
    }

    # 保存修改后的脚本
    Set-Content -Path $scriptPath -Value $scriptContent -Encoding UTF8

    # ===== 复制脚本到对应位置 =====
    Write-Output ""
    Write-Output "正在复制脚本..."
    
    if ($appType -eq "scratch") {
        $targetDir = $extractDir
        $htmlFile = Join-Path $extractDir "index.html"
    } else {
        $targetDir = Join-Path $extractDir "dist-renderer-webpack\editor\gui"
        $htmlFile = Join-Path $extractDir "dist-renderer-webpack\editor\gui\gui.html"
    }

    if (-not (Test-Path $targetDir)) {
        Write-Error "目标目录不存在：$targetDir"
        exit 1
    }

    $targetScriptPath = Join-Path $targetDir $scriptName
    Copy-Item -Path $scriptPath -Destination $targetScriptPath -Force -ErrorAction Stop
    Write-Output "  [成功] $targetScriptPath"

    # ===== 修改 HTML 文件 =====
    Write-Output ""
    Write-Output "正在修改 HTML 文件..."
    
    if (-not (Test-Path $htmlFile)) {
        Write-Error "HTML 文件不存在：$htmlFile"
        exit 1
    }

    $htmlContent = Get-Content -Path $htmlFile -Raw -Encoding UTF8
    $scriptTag = "<script src=`"$scriptName`"></script></body>"

    if ($htmlContent -match [regex]::Escape("</body>")) {
        if ($htmlContent -match [regex]::Escape($scriptTag)) {
            Write-Output "  [提示] 脚本已被添加，跳过重复添加"
        } else {
            # 检查是否已经包含脚本标签（无论路径是否相同）
            if ($htmlContent -match "<script\s+src=[`"'].*$scriptName[`"']></script>\s*</body>") {
                Write-Host "  [提示] 是否覆盖/更新已有的脚本标签？(Y/N): " -NoNewline
                $overwrite = Read-Host
                if ($overwrite -ne "Y") {
                    Write-Output "  [已跳过]"
                    goto SkipHtmlUpdate
                }
                # 替换已有的脚本标签
                $htmlContent = $htmlContent -replace "<script\s+src=[`"'].*$scriptName[`"']></script>\s*</body>", $scriptTag
            } else {
                # 直接替换 </body>
                $htmlContent = $htmlContent -replace "</body>", $scriptTag
            }
            
            Set-Content -Path $htmlFile -Value $htmlContent -Encoding UTF8 -ErrorAction Stop
            Write-Output "  [成功]"
        }
    } else {
        Write-Error "HTML 文件中未找到 </body>"
        exit 1
    }
    
    :SkipHtmlUpdate

    # ===== 打包 asar =====
    Write-Output ""
    Write-Output "正在打包修改后的 asar..."
    $tempAsar = "$targetAsar.new"
    & $asarPath pack $extractDir $tempAsar
    if ($LASTEXITCODE -ne 0) {
        Write-Error "打包失败，脚本终止。"
        exit 1
    }

    # 替换原 asar
    Remove-Item -Path $targetAsar -Force -ErrorAction Stop
    Move-Item -Path $tempAsar -Destination $targetAsar -Force -ErrorAction Stop
    Write-Output "  [成功]"

    Write-Output ""
    Write-Output "修补完成！请重新启动 $appName。"

} elseif ($action -eq "2") {
    # ===== 还原逻辑 =====
    Write-Output ""
    
    if (-not (Test-Path $asarBackup)) {
        Write-Error "未找到备份文件，无法还原：$asarBackup"
        exit 1
    }

    Write-Output "正在将 asar 还原为原始版本..."
    Remove-Item -Path $targetAsar -Force -ErrorAction Stop
    Copy-Item -Path $asarBackup -Destination $targetAsar -Force -ErrorAction Stop
    Write-Output "  [成功]"

    Write-Output ""
    Write-Output "还原完成！请重新启动 $appName。"
}

# -----------------------------------------------------------------------
# 清理
# -----------------------------------------------------------------------
Write-Output ""
Write-Output "正在清理临时文件..."
Remove-Item -Path $asarPath -Force -ErrorAction SilentlyContinue
if (Test-Path $extractDir) {
    Remove-Item -Path $extractDir -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Output "  [成功]"
