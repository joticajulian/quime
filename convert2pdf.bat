set /a count=0

for %%i in (.\*.svg) do (
   set /a count=count+1
   echo !count!.  %%i.pdf
   "%LOCALAPPDATA%\Microsoft\AppV\Client\Integration\E4E6D87C-1741-4532-B70D-A949FA7C4CF3\Root\inkscape.exe" %%i --export-pdf=%%i.pdf --export-dpi=300

   )
   
echo !count! file(s) converted!
