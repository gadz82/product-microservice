import type { Config } from 'jest';

const config: Config = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: { '^.+\\.(t|j)s$': 'ts-jest' },
	collectCoverageFrom: [
		'**/*.(t|j)s',
		'!**/*.spec.ts',
		'!**/index.ts',
		'!main.ts',
		'!**/*.module.ts',
		'!config/configuration.ts',
		'!database/**/*',
		'!common/config/configuration.ts'
	],
	coverageDirectory: '../coverage',
	testEnvironment: 'node'
};

export default config;
