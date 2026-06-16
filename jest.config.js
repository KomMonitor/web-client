// Jest config for @angular-builders/jest (Angular 18).
// The builder merges this with its internal jest-preset-angular defaults.
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testEnvironment: "jsdom",
  roots: ["<rootDir>/app"],
  // tsconfig.json uses `baseUrl: ./app` WITHOUT `paths`, so imports like
  // 'services/...' / 'components/...' must resolve relative to app/.
  moduleDirectories: ["node_modules", "<rootDir>/app"],
  testMatch: ["<rootDir>/app/**/*.spec.ts"],
  // Most node_modules are CommonJS; widen this only when a concrete ESM
  // transform error appears for a specific package.
  // leaflet-geosearch ships ESM only ("export {...}") and is pulled in by the
  // map component, so it must be transformed instead of ignored.
  transformIgnorePatterns: ["node_modules/(?!(?:.*\\.mjs$|leaflet-geosearch))"],
};
