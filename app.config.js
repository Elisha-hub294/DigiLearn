const appConfig = require("./app.json");

const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

if (facebookAppId) {
  appConfig.expo.plugins.push([
    "react-native-fbsdk-next",
    {
      appID: facebookAppId,
      displayName: appConfig.expo.name,
      scheme: `fb${facebookAppId}`,
    },
  ]);
}

module.exports = appConfig;
