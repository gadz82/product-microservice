import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
	@Exclude()
	id!: number;

	@ApiProperty({ example: 'apple-iphone-15-token' })
	@Expose()
	productToken!: string;

	@ApiProperty({ example: 'Apple iPhone 15' })
	@Expose()
	name!: string;

	@ApiProperty({ example: 999.99 })
	@Expose()
	price!: number;

	@ApiProperty({ example: 50 })
	@Expose()
	stock!: number;

	@ApiProperty({ example: '2026-06-07T16:27:00.000Z' })
	@Expose()
	createdAt!: Date;

	@ApiProperty({ example: '2026-06-07T16:27:00.000Z' })
	@Expose()
	updatedAt!: Date;
}
