@echo off
echo Starting Ellis dev server...
echo Open http://localhost:8080/map.html in your browser
python -m http.server 8080 --directory "%~dp0"
