const webpack = require('webpack');
const path    = require('path');

// Webpack Plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');


// SETTINGS
const CONST = {
    dir_source : 'src',
    dir_output : 'build'
};

const PATH = [
    ['source', CONST.dir_source],
    ['output', CONST.dir_output]
].reduce((acc, pair) => {
    acc[pair[0]] = path.resolve.bind({}, __dirname, pair[1]);
    return acc;
}, {});


const plugins = [
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
        template : PATH.source('index.html'),
        path     : PATH.output(),
        filename : 'index.html',
    }),
];


module.exports = (process_env) => {

    if ( !process_env.name ) { throw 'Environment not specified'; }
    const ENV = require('./environments/' + process_env.name + '.config.js');
    if ( !ENV ) { throw 'Environment ' + process_env.name + ' not exists'; }

    // Injecting globals
    plugins.push(new webpack.DefinePlugin({
        ENV: ENV.runtime
    }));

    return {
        devtool: ENV.build.devtool,
        entry  : PATH.source('index.js'),
        output : {
            filename : 'app.js',
            path     : PATH.output()
        },
        plugins
    };
};

