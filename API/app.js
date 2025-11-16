import express from 'express';
import path from 'path';
import YAML from 'yamljs';
import swaggerUiDist from 'swagger-ui-dist';
import helmet from 'helmet';
import cors from 'cors';
import v1Routes from './src/routes/api.routes.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

const swaggerYamlPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
const swaggerDocument = YAML.load(swaggerYamlPath);

if (isProd) {
  app.use(helmet());
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    hsts: false
  }));
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve('public')));

app.get('/api-docs', (req, res) => {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bike IoT API - Docs</title>
  <link rel="stylesheet" href="/api-docs/swagger-ui.css">
  <style> body{margin:0;padding:0;} </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="/api-docs/swagger-ui-bundle.js" crossorigin></script>
  <script src="/api-docs/swagger-ui-standalone-preset.js" crossorigin></script>

  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api-docs/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get('/api-docs/openapi.yaml', (req, res) => {
  res.sendFile(swaggerYamlPath);
});

const swaggerDistPath = swaggerUiDist.getAbsoluteFSPath();
app.use('/api-docs', express.static(swaggerDistPath));

// =====================================
// 📌 ROTA NOVA: STATUS DO IOT
// =====================================
app.get('/iot/status', (req, res) => {
  res.json({ online: global.iotOnline === true });
});

// Rotas normais já existentes
app.use('/v1', v1Routes);

app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
});

export default app;
