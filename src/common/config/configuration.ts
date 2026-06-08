export default (): object => ({
	nodeEnv: process.env.NODE_ENV ?? 'development',
	port: Number(process.env.PORT ?? 3000),
	database: {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT ?? 3306),
		name: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD
	}
});
