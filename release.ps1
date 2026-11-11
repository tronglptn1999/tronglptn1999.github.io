# Usage:  .\release.ps1 "mo ta thay doi"
# Stamps "vN . date time" in the invitation footer, commits and pushes to GitHub Pages.
param([Parameter(Mandatory)][string]$Message)
Set-Location $PSScriptRoot
$dot = [string][char]0x00B7
$n = [int](git rev-list --count HEAD) + 1
$stamp = "v$n $dot " + (Get-Date -Format "dd/MM/yyyy HH:mm")
$html = Get-Content index.html -Raw -Encoding UTF8
$html = [regex]::Replace($html, '<!--rel-->.*?<!--/rel-->', "<!--rel-->$stamp<!--/rel-->")
[IO.File]::WriteAllText("$PSScriptRoot\index.html", $html, (New-Object Text.UTF8Encoding $false))
git add index.html css js img audio google-apps-script release.ps1 README.md 2>$null
git commit -q -m "$Message ($stamp)"
git push
Write-Host "Released $stamp -> https://tronglptn1999.github.io/"
