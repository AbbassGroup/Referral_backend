// Simple script to restart the server
const { exec } = require('child_process');

console.log('Restarting server...');

// Kill any existing node processes on port 5001
exec('npx kill-port 5001', (error) => {
  if (error) {
    console.error(`Error killing port: ${error.message}`);
  } else {
    console.log('Port 5001 freed');
    
    // Start the server again
    exec('node index.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting server: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Server stderr: ${stderr}`);
        return;
      }
      console.log(`Server stdout: ${stdout}`);
    });
  }
}); 