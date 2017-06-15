module.exports = {
    name: 'dev',
    build: {
        compress: false,
        devtool: 'source-map'
    },
    runtime: {
        name: 'dev',
        api: '/api/'
    }
};
