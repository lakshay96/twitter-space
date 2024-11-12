export default {
    webpack(config, { isServer }) {
      // Forcing Webpack to ignore certain node_modules that cause issues
      config.externals = [
        ...config.externals,
        (context, request, callback) => {
          if (/clone-deep|merge-deep|puppeteer/.test(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
  
      return config;
    },
  };
  