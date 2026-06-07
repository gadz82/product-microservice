import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
	@ApiProperty({ example: 'Apple iPhone 15', description: 'The name of the product', maxLength: 255 })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name!: string;

	@ApiProperty({ example: 'iphone-15', description: 'Unique token identifying the product', maxLength: 255 })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	productToken!: string;

	@ApiProperty({ example: 999.99, description: 'Product price', maximum: 99999999.99 })
	@IsNumber()
	@IsPositive()
	@Max(99999999.99)
	price!: number;

	@ApiProperty({ example: 50, description: 'Available stock quantity', minimum: 0, maximum: 2147483647 })
	@IsNumber()
	@Min(0)
	@Max(2147483647)
	stock!: number;
}
