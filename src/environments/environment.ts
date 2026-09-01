export const environment = {
  production: true,
  apiUrl: 'https://d-cap-blog-backend---v2.whitepond-b96fee4b.westeurope.azurecontainerapps.io/',
  // Setzt eine Azure Static Web Apps-Bereitstellung mit api_location: "bff"
  // voraus -- siehe bff/README.md. Mit dem aktuellen Storage-Static-Website-
  // Deploy (azure-deploy.yml) gibt es kein /api, das ist ein offener Punkt.
  bffUrl: '/api',
};
