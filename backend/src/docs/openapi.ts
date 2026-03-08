export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'CamRent API',
    version: '1.0.0',
    description: 'API documentation for the CamRent marketplace backend.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['renter', 'owner', 'admin'] },
          full_name: { type: 'string' },
          avatar_url: { type: 'string' },
        },
      },
      Store: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          logo_url: { type: 'string' },
          banner_url: { type: 'string' },
          status: { type: 'string' },
          is_active: { type: 'boolean' },
          location_lat: { type: 'number', nullable: true },
          location_lng: { type: 'number', nullable: true },
          rating: { type: 'number' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a renter or owner account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role', 'full_name'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['renter', 'owner'] },
                  full_name: { type: 'string' },
                  profile_image_url: { type: 'string' },
                  store_name: { type: 'string' },
                  store_address: { type: 'string' },
                  store_description: { type: 'string' },
                  store_logo_url: { type: 'string' },
                  store_banner_url: { type: 'string' },
                  store_latitude: { type: 'number' },
                  store_longitude: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '400': { description: 'Registration failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
        },
      },
    },
    '/api/stores': {
      get: {
        summary: 'List approved public stores',
        responses: {
          '200': {
            description: 'Approved stores',
          },
        },
      },
      post: {
        summary: 'Create a store',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Store created' },
          '403': { description: 'Owner only' },
        },
      },
    },
    '/api/stores/{id}': {
      get: {
        summary: 'Get store details and items',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Store payload' } },
      },
    },
    '/api/items': {
      get: {
        summary: 'List items, or owner inventory when authenticated as owner',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Items list' } },
      },
      post: {
        summary: 'Create an item',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Item created' } },
      },
    },
    '/api/items/{id}': {
      get: {
        summary: 'Get item detail with availability',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Item detail' } },
      },
    },
    '/api/orders': {
      post: {
        summary: 'Create an order',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Order created' } },
      },
    },
    '/api/account/orders': {
      get: {
        summary: 'Get current renter order history',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Order history' } },
      },
    },
    '/api/dashboard/owner': {
      get: {
        summary: 'Get owner dashboard data',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Owner dashboard payload' } },
      },
    },
    '/api/owner/applications': {
      get: {
        summary: 'Get owner rental applications',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Applications list' } },
      },
    },
    '/api/dashboard/admin': {
      get: {
        summary: 'Get admin dashboard data',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Admin dashboard payload' } },
      },
    },
    '/api/admin/stores/{id}/approve': {
      post: {
        summary: 'Approve a pending store',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Store approved' } },
      },
    },
    '/api/admin/stores/{id}/active': {
      post: {
        summary: 'Set store active flag',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: {
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Store active flag updated' } },
      },
    },
    '/api/admin/fraud-list': {
      get: {
        summary: 'Get fraud list',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Fraud list' } },
      },
    },
    '/api/admin/fraud-analytics': {
      get: {
        summary: 'Get fraud analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Fraud analytics' } },
      },
    },
    '/api/upload': {
      post: {
        summary: 'Upload an image to Cloudinary',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: { '200': { description: 'Uploaded image URL' } },
      },
    },
    '/api/upload/public': {
      post: {
        summary: 'Upload an image for unauthenticated flows such as registration',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: { '200': { description: 'Uploaded image URL' } },
      },
    },
  },
} as const;

export function swaggerHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CamRent API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`;
}
