import { Router } from 'express';
import { openApiDocument, swaggerHtml } from '../docs/openapi';

export const docsRoutes = Router();

docsRoutes.get('/', (_req, res) => {
  res.type('html').send(swaggerHtml());
});

docsRoutes.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});
