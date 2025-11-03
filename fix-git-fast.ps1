# Fast Git fix - Remove node_modules from tracking

Write-Host "Removing node_modules from Git index..." -ForegroundColor Yellow

# Use git update-index to skip node_modules files (faster than git rm)
git ls-files | Where-Object { $_ -like "*node_modules*" } | ForEach-Object {
    git rm --cached $_ --quiet
}

Write-Host "Adding your actual changes..." -ForegroundColor Yellow

# Add deleted test files
git rm backend/fix-and-test.js backend/fix-connection.js backend/test-*.js backend/update-*.ps1 backend/update-*.js frontend/VITE_CACHE_FIX.md frontend/REACT_HOOK_FIX.md yarn.lock.backup --quiet 2>$null

# Add modified files
git add backend/src/ frontend/src/ package.json package-lock.json backend/data/

Write-Host "`nStatus:" -ForegroundColor Cyan
git status --short | Select-Object -First 20

Write-Host "`nReady to commit!" -ForegroundColor Green

