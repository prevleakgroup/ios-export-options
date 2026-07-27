# Local Development Server on Port 8080
# Runs download-site/ locally for testing before GitHub Pages deployment
# Does NOT affect live 443 production

param(
    [string]$Port = "8080",
    [string]$SiteDir = "download-site"
)

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  LOCAL DEV SERVER - Port 8080 (GitHub Pages @ 443 UNCHANGED)  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validate directory
if (-not (Test-Path $SiteDir)) {
    Write-Host "❌ Error: $SiteDir not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Site directory validated: $SiteDir" -ForegroundColor Green
Write-Host "📍 Local server: http://localhost:$Port" -ForegroundColor Yellow
Write-Host "🌐 Production (443): https://prevleakgroup.github.io (UNCHANGED)" -ForegroundColor Green
Write-Host ""

# Check if Python is available (preferred for simple HTTP server)
$pythonAvailable = $null -ne (Get-Command python -ErrorAction SilentlyContinue)

if ($pythonAvailable) {
    Write-Host "🚀 Starting Python HTTP server on port $Port..." -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    
    Push-Location $SiteDir
    python -m http.server $Port --bind 127.0.0.1
    Pop-Location
}
else {
    Write-Host "⚠️  Python not found. Using Node.js http-server..." -ForegroundColor Yellow
    
    # Check if http-server is installed globally
    $httpServerAvailable = $null -ne (Get-Command http-server -ErrorAction SilentlyContinue)
    
    if ($httpServerAvailable) {
        Write-Host "🚀 Starting Node http-server on port $Port..." -ForegroundColor Cyan
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        
        http-server $SiteDir -p $Port -c-1
    }
    else {
        # Fallback: Use Node.js built-in
        Write-Host "🚀 Starting Node.js server on port $Port..." -ForegroundColor Cyan
        
        $serverScript = @"
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = $Port;
const SITE_DIR = '$SiteDir';

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, SITE_DIR, req.url === '/' ? 'index.html' : req.url);
    
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, SITE_DIR, 'index.html');
    }
    
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Not Found</h1>', 'utf-8');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data, 'utf-8');
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(\`✅ Local dev server running: http://localhost:\${PORT}\`);
    console.log(\`🌐 Production (443): https://prevleakgroup.github.io\`);
    console.log(\`Press Ctrl+C to stop\`);
});
"@
        
        $serverScript | Out-File -FilePath "server.js" -Encoding UTF8
        node server.js
    }
}
