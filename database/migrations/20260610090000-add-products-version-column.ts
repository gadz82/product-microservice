import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.addColumn('products', 'version', {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0
	});
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.removeColumn('products', 'version');
}
