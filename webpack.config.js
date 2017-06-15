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


// MAIN
module.exports = (process_env) => {

    if ( !process_env.name ) { throw 'Environment not specified'; }
    const ENV = require('./environments/' + process_env.name + '.config.js');
    if ( !ENV ) { throw 'Environment ' + process_env.name + ' not exists'; }

    const loaders = [
        {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract({
                fallbackLoader: 'style-loader',
                loader: 'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader!sass-loader',
            })
        }
    ];

    const plugins = [
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({
            template : PATH.source('index.html'),
            path     : PATH.output(),
            filename : 'index.html',
        }),
        new ExtractTextPlugin("app.css"),
        new webpack.DefinePlugin({
            ENV: ENV.runtime
        })
    ];

    if ( ENV.build.compress ) {
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                screw_ie8: true,
                conditionals: true,
                unused: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                evaluate: true,
                if_return: true,
                join_vars: true,
            },
            output: {
                comments: false,
            },
        }));
    }


    return {
        devtool: ENV.build.devtool,
        entry  : [
            PATH.source('index.js'),
            PATH.source('index.scss')
        ],
        output : {
            filename : 'app.js',
            path     : PATH.output()
        },
        plugins,
        module: {
            loaders,
        },
    };
};

