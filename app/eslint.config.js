// @ts-check
const rootConfig = require("../eslint.config.js");

// Der gesamte Regelsatz ist zentral in ../eslint.config.js definiert; hier nur
// referenziert, damit das per angular.json verdrahtete Lint-Target eine Config
// im Projekt-Root findet.
module.exports = rootConfig;
