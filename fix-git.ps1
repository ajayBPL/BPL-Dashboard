# PowerShell script to fix Git node_modules tracking issue

Write-Host "Step 1: Removing node_modules from Git cache..." -ForegroundColor Cyan

# Remove node_modules from Git tracking without deleting files
git rm -r --cached node_modules 2>$null
git rm -r --cached */node_modules 2>$null  
git rm -r --cached shared/node_modules 2>$null

Write-Host "Step 2: Adding legitimate changes..." -ForegroundColor Cyan

# Add deleted test files
git add -u backend/fix-and-test.js backend/fix-connection.js 2>$null
git add -u backend/test-*.js 2>$null
git add -u backend/update-*.ps1 backend/update-*.js 2>$null
git add -u frontend/VITE_CACHE_FIX.md frontend/REACT_HOOK_FIX.md 2>$null
git add -u yarn.lock.backup 2>$null

# Add modified files
git add backend/src/routes/users.ts backend/src/services/database.ts 2>$null
git add frontend/src/components/*.tsx 2>$null
git add frontend/src/components/initiatives/*.tsx 2>$null
git add package.json package-lock.json 2>$null
git add backend/data/customDepartments.json backend/data/customRoles.json 2>$null

Write-Host "Step 3: Checking status..." -ForegroundColor Cyan
git status --short | Select-Object -First 30

Write-Host "`nDone! Now you can commit with: git commit -m 'Your message'" -ForegroundColor Green

