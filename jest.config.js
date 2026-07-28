// Jest config for @angular-builders/jest (Angular 18).
// The builder merges this with its internal jest-preset-angular defaults.
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app'],
  // tsconfig.json uses `baseUrl: ./app` WITHOUT `paths`, so imports like
  // 'services/...' / 'components/...' must resolve relative to app/.
  moduleDirectories: ['node_modules', '<rootDir>/app'],
  testMatch: ['<rootDir>/app/**/*.spec.ts'],
  // Most node_modules are CommonJS; widen this only when a concrete ESM
  // transform error appears for a specific package.
  // leaflet-geosearch ships ESM only ("export {...}") and is pulled in by the
  // map component. echarts/core (used by admin-dashboard-management via ngx-echarts'
  // provideEchartsCore) and its dependency zrender resolve to ESM entry points, so
  // these must be transformed instead of ignored. (Plain `import * as echarts from
  // 'echarts'` resolves to the UMD main and loads without this.)
  transformIgnorePatterns: ['node_modules/(?!(?:.*\\.mjs$|leaflet-geosearch|echarts|zrender))'],
  // d3 v7 is ESM-only and pulls in a large ESM family (d3-*, internmap, delaunator …).
  // Map the bare `d3` import to its prebuilt UMD bundle instead of transforming the
  // whole tree — used by reporting-overview / indicator-add (`import * as d3 from 'd3'`).
  moduleNameMapper: {
    '^d3$': '<rootDir>/node_modules/d3/dist/d3.js',
  },
};
