export default (): object => ({
	port: parseInt(process.env.PORT ?? '3000', 10),
	database: {
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT ?? '3306', 10),
		name: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD
	},
	redis: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT ?? '6379', 10)
	}
});
