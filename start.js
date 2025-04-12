const { spawn } = require('child_process');
const path = require('path');

// Start the server
console.log('Starting server...');
const server = spawn('node', ['server/imageServer.js'], {
  stdio: 'inherit',
  shell: true
});

// Start the client
console.log('Starting client...');
const client = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill();
  client.kill();
  process.exit();
});

console.log('Both server and client are running!');
console.log('Press Ctrl+C to stop both processes.');
