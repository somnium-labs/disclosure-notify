const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    plugins: [new webpack.EnvironmentPlugin(['CONFIG'])],
    entry: './src/index.ts',
    mode: process.env.NODE_ENV,
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    module: {
        rules: [
            {
                loader: 'ts-loader',
                test: /\.ts$/,
                exclude: [/node_modules/],
                options: {
                    configFile: 'tsconfig.json',
                },
            },
        ],
    },
    devtool: 'source-map',
};
