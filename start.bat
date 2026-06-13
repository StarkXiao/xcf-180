@echo off
echo ========================================
echo   XCF-180 机车改装配件选配系统
echo   一键启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务 (端口 3001)...
start "XCF-180 Backend" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 2 /nobreak >nul

echo [2/2] 启动前端开发服务器 (端口 5173)...
start "XCF-180 Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   系统已启动！
echo   后端: http://localhost:3001
echo   前端: http://localhost:5173
echo ========================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5173
