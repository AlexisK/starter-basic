module.exports = {
    name: 'prod',
    build: {
        compress: true,
        devtool: 'eval'
    },
    runtime: {
        name: 'prod',
        api: '/api/'
    }
};
