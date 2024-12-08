module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    coverageDirectory: './coverage',
    collectCoverage: true,
    coverageReporters: ["lcov", "text"],
    collectCoverageFrom: ['**/javascripts/**'],
};