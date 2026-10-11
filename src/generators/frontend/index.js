import path from 'path';
import { writeFile } from '../../utils/helpers.js';

export async function generateFrontend(projectRoot, config) {
  const frontendDir = path.join(projectRoot, 'frontend');
  const baseName = path.basename(config.projectName);

  // package.json
  await writeFile(
    path.join(frontendDir, 'package.json'),
    JSON.stringify(
      {
        name: `${baseName}-frontend`,
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.2.1',
          vite: '^5.0.0',
        },
      },
      null,
      2
    ) + '\n'
  );

  // vite.config.js
  await writeFile(
    path.join(frontendDir, 'vite.config.js'),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
`
  );

  // index.html
  await writeFile(
    path.join(frontendDir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${baseName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
  );

  // src/main.jsx
  await writeFile(
    path.join(frontendDir, 'src/main.jsx'),
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
  );

  // src/App.jsx
  await writeFile(
    path.join(frontendDir, 'src/App.jsx'),
    `import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(\`\${API_URL}/api/health\`);
        const data = await res.json();
        if (res.ok) {
          setHealth(data);
        } else {
          setError(data.message || 'Health check failed');
        }
      } catch (err) {
        setError(err.message || 'Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h1>${baseName}</h1>
      <p>Frontend: React + Vite (JavaScript)</p>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '20px',
          background: '#f9f9f9',
        }}
      >
        <h2>Backend Status</h2>
        {loading && <p>Checking backend...</p>}
        {error && (
          <p style={{ color: 'red' }}>
            Backend not reachable: {error}
            <br />
            <small>Expected backend at {API_URL}/api/health</small>
          </p>
        )}
        {health && (
          <div>
            <p style={{ color: 'green' }}>Backend is reachable</p>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
`
  );

  // src/index.css
  await writeFile(
    path.join(frontendDir, 'src/index.css'),
    `* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: #fff;
  color: #222;
}
`
  );

  // .env.example
  await writeFile(
    path.join(frontendDir, '.env.example'),
    `# Frontend environment variables
# Backend API base URL (no trailing slash)
VITE_API_URL=http://localhost:3000
`
  );
}
