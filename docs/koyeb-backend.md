# Koyeb Backend Deployment

Deploy the backend from GitHub as a Koyeb Web Service.

## Service Settings

- Repository: `mrHeinrichh/camRent-SaaS`
- Branch: `main`
- Builder: Buildpack
- Work directory: `backend`
- Build command: leave default or use `npm install`
- Run command: `npm run start`
- Exposed port: `3001`

Koyeb sets the `PORT` environment variable from the exposed port, and the backend reads it automatically.

## Environment Variables

Use the same values as the current backend, except use Gmail SMTP port `587` on Koyeb:

```text
MONGODB_URI=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
CORS_ORIGINS=https://your-vercel-frontend.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=CamRent PH <yourgmail@gmail.com>
```

Koyeb blocks outbound SMTP port `25`, but their FAQ recommends port `587` for encrypted SMTP.

## Frontend Update

After Koyeb deploys, copy the backend public URL and set these Vercel frontend variables:

```text
VITE_API_TARGET=live
VITE_API_URL_LIVE=https://your-koyeb-backend.koyeb.app
```

Redeploy the Vercel frontend after changing the variables.
