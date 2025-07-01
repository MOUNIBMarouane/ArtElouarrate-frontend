import { spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 8080;

if (isProduction) {
  console.log('🎨 Starting ELOUARATE ART Frontend (Production)...');
  console.log(`📡 Frontend will run on port: ${port}`);
  console.log('🔗 Serving built application...');
  console.log('✨ Ready to showcase amazing pencil art!');
  console.log('─'.repeat(50));

  // Simple static file server for production
  const server = createServer((req, res) => {
    let filePath = './dist' + (req.url === '/' ? '/index.html' : req.url);
    
    // Handle SPA routing - serve index.html for non-file requests
    if (!existsSync(filePath) && !req.url.includes('.')) {
      filePath = './dist/index.html';
    }

    try {
      const content = readFileSync(filePath);
      const ext = filePath.split('.').pop();
      const contentType = {
        'html': 'text/html',
        'js': 'text/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml'
      }[ext] || 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`✅ Frontend server running on port ${port}`);
  });
} else {
  console.log('🎨 Starting ELOUARATE ART Frontend (Development)...');
  console.log('📡 Frontend will run on: http://localhost:8080');
  console.log('🔗 Backend API endpoint: https://artelouarrate-production.up.railway.app');
  console.log('✨ Ready to showcase amazing pencil art!');
  console.log('─'.repeat(50));

  const frontend = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true 
  });

  frontend.on('close', (code) => {
    console.log(`Frontend exited with code ${code}`);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down frontend...');
    frontend.kill();
    process.exit();
  });
} 