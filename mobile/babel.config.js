module.exports = {
  presets: [
    'module:@react-native/babel-preset', 
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/transform-runtime'],
    ['module-resolver', { alias: { '~': './src' } }],
    ['react-native-reanimated/plugin'],
  ],
};