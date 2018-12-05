"use strict";

function buildConfig(env = {}) {
    let filename;
    switch (env) {
        case env.production:
        case env.test:
            filename = "prod";
            break;
        default:
            filename = "dev";
    }
    return require('./config/' + filename + '.js')(env)
}

module.exports = buildConfig;
