module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-react-native-web',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  features: {
    buildStoriesJson: true,
  },
  webpackFinal: async (config) => {
    // Add support for TypeScript
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      ],
    });

    // Add support for React Native Web
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      '@storybook/react-native': '@storybook/react',
    };

    config.resolve.extensions.push('.ts', '.tsx');

    return config;
  },
};