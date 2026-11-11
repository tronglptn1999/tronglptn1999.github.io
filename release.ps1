# Dùng:  .\release.ps1 "mô tả thay đổi"
# Tự đóng dấu "vN · ngày giờ" ở chân thiệp, commit và push lên GitHub Pages.
param([Parameter(Mandatory)][string]$Message)
Set-Location $PSScriptRoot
$n = [int](git rev-list --count HEAD) + 1
$stamp = "v$n · " + (Get-Date -Format "dd/MM/yyyy HH:mm")
$html = Get-Content index.html -Raw -Encoding UTF8
$html = [regex]::Replace($html, '<!--rel-->.*?<!--/rel-->', "<!--rel-->$stamp<!--/rel-->")
[IO.File]::WriteAllText("$PSScriptRoot\index.html", $html, (New-Object Text.UTF8Encoding $false))
git add index.html css js img audio google-apps-script release.ps1 README.md 2>$null
git commit -q -m "$Message ($stamp)"
git push
Write-Host "Đã phát hành $stamp -> https://tronglptn1999.github.io/"
