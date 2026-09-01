export const environment = {
  production: false,
  apiUrl: 'https://d-cap-blog-backend---v2.whitepond-b96fee4b.westeurope.azurecontainerapps.io/',
  // Relativ, nicht http://localhost:7071/api -- proxy.conf.json leitet /api/*
  // an die lokale BFF weiter, damit Frontend und BFF aus Browsersicht auf
  // derselben Origin laufen (Voraussetzung für den Login-Redirect-Flow).
  bffUrl: '/api',
};
