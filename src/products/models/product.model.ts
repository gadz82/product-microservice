import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'products', timestamps: true })
export class Product extends Model {
	@Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
	declare id: number;

	@Column({ type: DataType.STRING, allowNull: false, unique: true })
	declare productToken: string;

	@Column({ type: DataType.STRING, allowNull: false })
	declare name: string;

	@Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
	declare price: number;

	@Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
	declare stock: number;
}
