module.exports = {
    name: 'stage',
    build: {
        compress: true,
        devtool: 'eval'
    },
    runtime: {
        name: 'stage',
        api: '/api/'
    }
};
