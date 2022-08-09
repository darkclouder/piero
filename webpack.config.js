/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const nodeModules = path.resolve(__dirname, "node_modules");
const sourceDir = path.resolve(__dirname, "src");
const distDir = path.resolve(__dirname, "dist");

module.exports = (_, argv) => {
    const isProduction = argv.mode === "production";

    return {
        entry: path.resolve(sourceDir, "canvas", isProduction ? "index.ts" : "dev.ts"),
        devtool: !isProduction && "inline-source-map",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: [nodeModules],
                },
            ],
        },
        resolve: {
            plugins: [new TsconfigPathsPlugin()],
            extensions: [".tsx", ".ts", ".js"],
            modules: [nodeModules],
        },
        output: {
            filename: isProduction ? "production.js" : "dev.js",
            path: distDir,
            library: "Piero",
            libraryTarget: "var", // TODO: reconsider in production!
        },
        devServer: {
            static: distDir,
            port: 9000,
        },
    };
};
