export default ({ config }) => ({
    ...config,
    name: "Dhvani",
    slug: "Dhvani",
    version: "2.1.5",
    orientation: "portrait",
    icon: "./assets/images/splash.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.vishu.events"
    },
    android: {
      package: "com.vishu.events",
       versionCode: 15,
      adaptiveIcon: {
        foregroundImage: "./assets/images/splash.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "webpack",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-web-browser",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          resizeMode: "cover",
          backgroundColor: "#ffffff",
          enableFullScreenImage_legacy: true
        }
      ],
      [
        "expo-font",
        {}
      ]
    ],
    experiments: {
      typedRoutes: false
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "f60f2d31-e43a-440d-be1a-a7f81f938679"
      }
    },
    owner: "ipsitamondal"
  });