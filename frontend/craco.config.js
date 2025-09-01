const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  // --- THIS IS THE FINAL, CORRECTED CONFIGURATION ---
  devServer: (devServerConfig) => {
    devServerConfig.headers = {
      // This allows the page to load scripts from Google...
      'Cross-Origin-Embedder-Policy': 'require-corp', 
      // ...while also allowing the login pop-up to communicate with your page.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', 
    };
    return devServerConfig;
  },
  // ---------------------------------------------------
};
