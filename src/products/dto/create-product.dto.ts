import { IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
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

	@ApiProperty({ example: '999.99', description: 'Product price as a decimal string (e.g. "99.99"), max 8 integer + 2 decimal digits' })
	@IsString()
	@Matches(/^\d{1,8}(\.\d{1,2})?$/, { message: 'price must be a positive decimal string with up to 2 decimal places (max 99999999.99)' })
	price!: string;

	@ApiProperty({ example: 50, description: 'Available stock quantity', minimum: 0, maximum: 2147483647 })
	@IsNumber()
	@Min(0)
	@Max(2147483647)
	stock!: number;
}
