import { Exclude, Expose } from 'class-transformer';

export class ProductResponseDto {
	@Exclude()
	id!: number;

	@Exclude()
	productToken!: string;

	@Expose()
	name!: string;

	@Expose()
	price!: number;

	@Expose()
	stock!: number;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt!: Date;
}
