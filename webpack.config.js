//webpack potrzebuje ścieżki absolutnej
const path = require('path');

module.exports = {
    entry: {
        frontend: './resources/js/frontend/frontend.js',
        backend: './resources/js/backend/backend.js'
    },
    output:  {
        path: path.resolve(__dirname, './public/js'),
        filename: '[name].js'
    },
    mode: "development",
    module: {
        rules: [
            { 
                loader: 'babel-loader', //nazwa loadera
                query: {
                    presets: ['@babel/preset-env'] //jaki ma być standard?
                },
                test: /\.js$/, //chcę tylko javascriptiowe pliki
                exclude: /node-modules/
            }
        ]
    }
}