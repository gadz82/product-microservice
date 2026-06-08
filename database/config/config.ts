import 'dotenv/config';

export = {
	development: {
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		dialect: 'mysql',
		logging: process.env.DB_LOGGING === 'true' ? console.log : false
	},
	test: {
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		dialect: 'mysql',
		logging: process.env.DB_LOGGING === 'true' ? console.log : false
	},
	production: {
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		dialect: 'mysql',
		logging: process.env.DB_LOGGING === 'true' ? console.log : false
	}
};
