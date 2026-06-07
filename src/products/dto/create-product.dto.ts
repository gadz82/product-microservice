import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateProductDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	productToken!: string;

	@IsNumber()
	@IsPositive()
	price!: number;

	@IsNumber()
	@Min(0)
	stock!: number;
}
