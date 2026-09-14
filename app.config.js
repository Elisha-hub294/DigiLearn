const appConfig = require("./app.json");

const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim();
const facebookClientToken =
  process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN?.trim();

if (facebookAppId) {
  appConfig.expo.plugins.push([
    "react-native-fbsdk-next",
    {
      appID: facebookAppId,
      clientToken: facebookClientToken,
      displayName: appConfig.expo.name,
      scheme: `fb${facebookAppId}`,
    },
  ]);
}

module.exports = appConfig;
