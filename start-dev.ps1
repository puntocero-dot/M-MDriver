# M&M Driver — Dev environment launcher
# Ejecuta desde la raiz del proyecto: .\start-dev.ps1

Write-Host "`nM&M Driver — Iniciando servidores de desarrollo...`n" -ForegroundColor Yellow

# Backend — puerto 3000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\DELL\Desktop\Proyectos\Pirin_Project\backend'; Write-Host 'BACKEND (3000)' -ForegroundColor Cyan; npm run start:dev"

Start-Sleep -Seconds 2

# Admin panel — puerto 3001
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\DELL\Desktop\Proyectos\Pirin_Project\admin'; Write-Host 'ADMIN (3001)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 1

# Landing page — puerto 3002
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\DELL\Desktop\Proyectos\Pirin_Project\landing'; Write-Host 'LANDING (3002)' -ForegroundColor Magenta; npm run dev"

Write-Host "`nServidores iniciando. Abriendo navegador en 8 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Start-Process "http://localhost:3001"
Start-Process "http://localhost:3002"

Write-Host "`nURLs disponibles:" -ForegroundColor Green
Write-Host "  API Backend  -> http://localhost:3000/api/v1" -ForegroundColor Cyan
Write-Host "  Admin Panel  -> http://localhost:3001" -ForegroundColor Green
Write-Host "  Landing Page -> http://localhost:3002" -ForegroundColor Magenta
Write-Host "  Swagger Docs -> http://localhost:3000/api/docs" -ForegroundColor Yellow
