$routeFiles = Get-ChildItem -Path "C:\RiverWorksIT\Clients\Micheal Wojciak (Mike)\Proyects\FixMyRV\WebApp\backend\routes" -Filter "*.ts" -Recurse

foreach ($file in $routeFiles) {
    Write-Host "Fixing ES module imports in $($file.Name)..."
    
    $content = Get-Content $file.FullName -Raw
    
    # Fix relative imports by adding .js extensions
    $content = $content -replace 'from\s+["\'](\.\./[^"\']+)["\'](?!\.js)', 'from "$1.js"'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Fixed $($file.Name)"
}

Write-Host "All route files have been fixed!"
