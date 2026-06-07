import { IsNumber, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
	@ApiProperty({ example: 100, description: 'New stock quantity', minimum: 0, maximum: 2147483647 })
	@IsNumber()
	@Min(0)
	@Max(2147483647)
	stock!: number;
}
