// src/services/config.ts

// This file contains the hardcoded API key for Twitter
// and the base URLs for the proxy.

const API_CONFIG = {
  twitter: {
    baseUrl: '/twitter-api',
    // This is the base64 encoded version of b8d23504206b4ebe86be0a4329e1e727
    key: atob('YjhkMjM1MDQyMDZiNGViZTg2YmUwYTQzMjllMWU3Mjc=')
  },
  ai: {
    baseUrl: '/ai-api',
    key: atob('YzAxNjU0NDA0OTM4NDZiMzM5NDM4ZmFiNzYyNjgzODM1Y2Y4Yjc4YTljMmQzYzEyMTY1NTVlNDkxNTY1Y2E2YQ==')
  },
  telegram: {
    baseUrl: '/telegram-api'
  }
};

export default API_CONFIG;
