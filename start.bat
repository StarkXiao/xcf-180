@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================
echo   XCF-180 机车改装配件选配系统
echo   一键启动脚本
echo ========================================
echo.

echo [0/4] 检查并生成配件图片...
if not exist "%~dp0backend\public\images\parts\exhaust-001.svg" (
    echo 首次运行，正在生成配件图片...
    cd /d "%~dp0backend"
    node generate-images.mjs
    if errorlevel 1 (
        echo [警告] 图片生成失败，系统仍可运行
    )
    cd /d "%~dp0"
) else (
    echo 配件图片已就绪
)
echo.

echo [1/4] 检查依赖安装...
set NEED_INSTALL=0
if not exist "%~dp0backend\node_modules" (
    set NEED_INSTALL=1
    echo 后端依赖缺失，将进行安装...
)
if not exist "%~dp0frontend\node_modules" (
    set NEED_INSTALL=1
    echo 前端依赖缺失，将进行安装...
)
if !NEED_INSTALL! equ 1 (
    echo.
    if not exist "%~dp0backend\node_modules" (
        echo 正在安装后端依赖...
        cd /d "%~dp0backend"
        call npm install
        if errorlevel 1 (
            echo [错误] 后端依赖安装失败
            pause
            exit /b 1
        )
        echo 后端依赖安装完成
        cd /d "%~dp0"
    )
    if not exist "%~dp0frontend\node_modules" (
        echo 正在安装前端依赖...
        cd /d "%~dp0frontend"
        call npm install
        if errorlevel 1 (
            echo [错误] 前端依赖安装失败
            pause
            exit /b 1
        )
        echo 前端依赖安装完成
        cd /d "%~dp0"
    )
) else (
    echo 依赖检查通过
)
echo.

echo [2/4] 启动后端服务 (端口 3001)...
start "XCF-180 Backend" /min cmd /k "cd /d %~dp0backend && npm run dev"

echo 等待后端服务启动...
set WAIT_COUNT=0
set BACKEND_READY=0
:wait_backend
if !WAIT_COUNT! geq 30 goto backend_done
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/categories' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if !errorlevel! equ 0 (
    set BACKEND_READY=1
    goto backend_done
)
set /a WAIT_COUNT+=1
echo   等待中... !WAIT_COUNT!/30
goto wait_backend
:backend_done
if !BACKEND_READY! equ 1 (
    echo 后端服务已就绪 ✓
) else (
    echo [警告] 后端启动超时，请稍后手动检查
)
echo.

echo [3/4] 启动前端开发服务器...
start "XCF-180 Frontend" /min cmd /k "cd /d %~dp0frontend && npm run dev"

echo 等待前端服务启动...
set WAIT_COUNT=0
set FRONT_PORT=0
:wait_frontend
if !WAIT_COUNT! geq 60 goto frontend_done
timeout /t 1 /nobreak >nul
set TEST_PORTS=5173 5174 5175 5176
for %%P in (%TEST_PORTS%) do (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%%P' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
    if !errorlevel! equ 0 (
        set FRONT_PORT=%%P
        goto frontend_done
    )
)
set /a WAIT_COUNT+=1
if !WAIT_COUNT! equ 1 echo   启动中，请稍候...
if !WAIT_COUNT! equ 15 echo   Vite 编译中，需要较长时间...
if !WAIT_COUNT! equ 30 echo   仍在编译，马上好了...
goto wait_frontend
:frontend_done
if !FRONT_PORT! neq 0 (
    echo 前端服务已就绪 ✓ (端口 !FRONT_PORT!)
) else (
    echo [警告] 前端启动超时，请稍后手动检查端口
    set FRONT_PORT=5173
)
echo.

echo [4/4] 验证图片链路...
set IMAGE_OK=0
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/images/parts/exhaust-001.svg' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if !errorlevel! equ 0 (
    set IMAGE_OK=1
)
if !IMAGE_OK! equ 1 (
    echo 本地图片链路正常 ✓
) else (
    echo [提示] 图片服务检测，如未显示请刷新页面
)
echo.

echo ========================================
echo   🎉 系统已启动完成！
echo   ------------------------------------
echo   后端API:  http://localhost:3001
echo   前端页面: http://localhost:!FRONT_PORT!
echo   图片路径: http://localhost:3001/images/parts/
echo   ------------------------------------
echo   功能模块:
echo     • 配件浏览 - 分类筛选 + 搜索
echo     • 机车预览 - SVG可视化搭配
echo     • 选配清单 - 管理 + 导出
echo ========================================
echo.

echo 正在打开浏览器访问前端页面...
timeout /t 1 /nobreak >nul
start "" "http://localhost:!FRONT_PORT!"

echo.
echo 提示: 关闭此窗口不影响服务运行
echo 按任意键退出启动脚本...
pause >nul
endlocal
