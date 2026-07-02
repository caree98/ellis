$path = "C:\Dev\ellis\building-scorecard.html"
$content = Get-Content $path -Raw

$old = "    <a href=""index.html"" class=""back-link"" aria-label=""Back to Ellis home"">
      <svg width=""14"" height=""14"" viewBox=""0 0 14 14"" aria-hidden=""true""><path d=""M8.5 2.5 L4 7 L8.5 11.5"" fill=""none"" stroke=""currentColor"" stroke-width=""1.5"" stroke-linecap=""square""/></svg>
      <span>Ellis</span>
    </a>
    <div class=""brand"">
      <img src=""assets/flag-logo.png"" alt="""" width=""54"" height=""44"" style=""display:block; margin-right:9px; align-self:center;"">
      <div class=""mark"">ellis</div>
      <div class=""sub"">building scorecard</div>
    </div>"

$new = "    <div class=""brand"">
      <a href=""index.html"" aria-label=""Back to Ellis home"" style=""display:flex; align-items:baseline; gap:12px; color:inherit; text-decoration:none;"">
        <img src=""assets/flag-logo.png"" alt="""" width=""54"" height=""44"" style=""display:block; margin-right:9px; align-self:center;"">
        <div class=""mark"">ellis</div>
      </a>
      <div class=""sub"">building scorecard</div>
    </div>"

$content = $content.Replace($old, $new)
Set-Content $path $content -NoNewLine
Write-Host "Done"
