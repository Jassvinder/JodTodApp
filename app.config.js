// Extends app.json with values that come from .env, so no URL is hardcoded in config files.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    router: {
      ...config.extra?.router,
      origin: process.env.EXPO_PUBLIC_API_URL,
    },
  },
});
