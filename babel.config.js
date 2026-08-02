module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Keep react-native-reanimated/plugin LAST in the list
      'react-native-reanimated/plugin',
    ],
  };
};
