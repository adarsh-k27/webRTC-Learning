const path = require('path');

module.exports = {
  entry: './script.js',
  mode:"development",  // Entry point of your JavaScript file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',  // Output file name
  },
};
