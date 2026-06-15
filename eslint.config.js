// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");

// Milder Einstiegs-Regelsatz für die laufende Migration (siehe PROPOSED_CHANGES.md, Prio 8).
// Ziel: `ng lint` läuft grün (0 errors) und ist damit sofort als CI-Gate nutzbar.
// Regeln, die durch die gewachsene/teilweise untypisierte Codebasis viel Rauschen
// erzeugen, stehen vorerst auf "warn" (sichtbar, aber nicht blockierend) bzw. "off"
// (bewusste Patterns). Schrittweise hochziehen ("ratchet"), sobald aufgeräumt.
module.exports = tseslint.config(
  {
    // Nicht zu lintender Code: vendored Libs liegen außerhalb app/ (werden ohnehin
    // nicht über lintFilePatterns erfasst); hier die zwei bewusst behaltenen
    // AngularJS-Restfeatures sowie generierte/kompilierte Artefakte ausschließen.
    ignores: [
      "dist/**",
      "**/*.js",
      "**/*.js.map",
      "app/components/kommonitorUserInterface/kommonitorControls/feedbackModal/**",
      "app/components/kommonitorUserInterface/kommonitorControls/kommonitorIndividualIndicatorComputation/**",
    ],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      // tseslint.configs.stylistic bewusst weggelassen: reine Stilregeln
      // (array-type, consistent-*, ...) erzeugen auf der gewachsenen Codebasis viel
      // Rauschen und überschneiden sich mit Prettier. Später gezielt nachziehen.
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        // Viele bestehende Komponenten nutzen noch andere Prefixes -> vorerst warnen.
        "warn",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],

      // Logging dauerhaft eindämmen (Prio 8) -- vorerst als Warnung, da ~240 Vorkommen.
      "no-console": "warn",

      // Bewusst aus: die Codebasis ist stellenweise absichtlich untypisiert
      // (noImplicitAny ist aus) bzw. nutzt require()-Interop für einzelne Libs.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-inferrable-types": "off",

      // Sinnvoll, aber aktuell zu viele Treffer -> als Warnung sichtbar machen.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/prefer-for-of": "warn",
      "no-prototype-builtins": "warn",
      "no-empty": "warn",
      "no-useless-catch": "warn",
      "no-useless-escape": "warn",
      "@angular-eslint/no-empty-lifecycle-method": "warn",
      "@angular-eslint/use-lifecycle-interface": "warn",
      "@angular-eslint/no-output-native": "warn",
      "@angular-eslint/contextual-lifecycle": "warn",

      // var/const: der Großteil wurde per --fix bereinigt; die restlichen Fälle
      // sind Legacy-Patterns, die ESLint nicht sicher umschreiben kann -> warn.
      "no-var": "warn",
      "prefer-const": "warn",

      // Vorerst auf "warn", um einen grünen Baseline zu erreichen. Die mit (!)
      // markierten sind echte Funde und gute erste Ratchet-Kandidaten:
      "no-debugger": "warn", //               (!) debugger-Statement im Code
      "no-self-assign": "warn", //            (!) Zuweisung an sich selbst
      "no-dupe-else-if": "warn", //           (!) toter else-if-Zweig
      "no-constant-binary-expression": "warn", // (!) konstante Bedingung
      "no-case-declarations": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/adjacent-overload-signatures": "warn",
      "@angular-eslint/no-output-on-prefix": "warn",
      "@angular-eslint/component-class-suffix": "warn",
      "@angular-eslint/use-pipe-transform-interface": "warn",
      "@typescript-eslint/no-array-constructor": "warn",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Accessibility-Regeln liefern aktuell sehr viele Treffer; vorerst als
      // Warnung, damit der Lint-Lauf grün bleibt und sie sukzessive abgearbeitet
      // werden können.
      "@angular-eslint/template/label-has-associated-control": "warn",
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
      "@angular-eslint/template/mouse-events-have-key-events": "warn",
      "@angular-eslint/template/alt-text": "warn",
      "@angular-eslint/template/eqeqeq": "warn",
      "@angular-eslint/template/elements-content": "warn",
    },
  },
  // Formatierung übernimmt Prettier -> kollidierende ESLint-Formatregeln abschalten.
  // Muss zuletzt stehen.
  eslintConfigPrettier
);
