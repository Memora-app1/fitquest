// eslint-config-next v16 exports native flat config arrays — no FlatCompat needed
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");
const nextTypescript = require("eslint-config-next/typescript");

module.exports = [
  ...nextCoreWebVitals,
  ...nextTypescript,
];
