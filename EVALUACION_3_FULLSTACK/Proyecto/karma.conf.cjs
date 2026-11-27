module.exports = (config) => {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [{ pattern: 'test/karma-entry.jsx', watched: false }],
    preprocessors: { 'test/karma-entry.jsx': ['webpack'] },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      module: {
        rules: [{
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'last 2 Chrome versions' }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
              plugins: [['babel-plugin-istanbul', { include: ['src/**/*.jsx', 'src/**/*.js'] }]],
            },
          },
        }],
      },
      resolve: { extensions: ['.js', '.jsx'] },
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage',
      subdir: 'karma',
      reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'text-summary' }],
      include: ['src/**/*.jsx', 'src/**/*.js'],
      exclude: ['src/main.jsx'],
    },
    browsers: ['jsdom'],
    singleRun: true,
    restartOnFileChange: false,
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-coverage',
      'karma-webpack',
      'karma-jsdom-launcher',
    ],
  });
};
