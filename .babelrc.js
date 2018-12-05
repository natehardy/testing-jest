const isTest = String(process.env.NODE_ENV) === "test";
const isProd = String(process.env.NODE_ENV) === "production";
const isDev = String(process.env.NODE_ENV) === "development";
console.log("isTesting:", isTest);
console.log("isDev", isDev);
module.exports = {
    presets: [
        ["@babel/preset-env", { modules: isTest ? "commonjs" : false }],
        "@babel/preset-react"
    ],

    plugins: [
        isTest ? "@babel/plugin-transform-modules-commonjs" : null,
        isDev ? "@babel/plugin-transform-react-jsx-source" : null,
        isDev ? "@babel/plugin-proposal-class-properties" : null,
        isDev ? "@babel/plugin-proposal-export-default-from" : null,
        isDev ? "@babel/plugin-syntax-dynamic-import" : null,
        isDev ? "@babel/plugin-transform-runtime" : null,
        isDev ? "@babel/plugin-transform-parameters" : null,
        "lodash",
        // Enables React code to work with HMR.
        isDev ? "react-hot-loader/babel" : null
    ].filter(Boolean)
};
