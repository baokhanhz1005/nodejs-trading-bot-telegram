const path = require("path");

module.exports = {
  entry: "./app/index.netlify.js",
  output: {
    filename: "telegram-bot.js",
    path: path.resolve(__dirname, "..", "functions"),
    libraryTarget: "commonjs",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
};
