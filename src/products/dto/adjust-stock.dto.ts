import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
	@ApiProperty({ example: -2, description: 'Stock delta (negative to decrement, positive to increment)' })
	@IsInt()
	@IsNotEmpty()
	delta!: number;
}
