import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateStockDto } from './update-stock.dto';

describe('DTO Validation', () => {
	describe('CreateProductDto', () => {
		it('should pass with valid data', async () => {
			const dto = new CreateProductDto();
			dto.name = 'Valid Name';
			dto.productToken = 'valid-token';
			dto.price = 100.0;
			dto.stock = 10;

			const errors = await validate(dto);
			expect(errors.length).toBe(0);
		});

		it('should fail if name exceeds 255 characters', async () => {
			const dto = new CreateProductDto();
			dto.name = 'a'.repeat(256);
			dto.productToken = 'token';
			dto.price = 10;
			dto.stock = 5;

			const errors = await validate(dto);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0].property).toBe('name');
		});

		it('should fail if productToken exceeds 255 characters', async () => {
			const dto = new CreateProductDto();
			dto.name = 'Name';
			dto.productToken = 't'.repeat(256);
			dto.price = 10;
			dto.stock = 5;

			const errors = await validate(dto);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0].property).toBe('productToken');
		});

		it('should fail if price is too high', async () => {
			const dto = new CreateProductDto();
			dto.name = 'Name';
			dto.productToken = 'token';
			dto.price = 100000000; // 10^8
			dto.stock = 5;

			const errors = await validate(dto);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0].property).toBe('price');
		});

		it('should fail if stock is too high', async () => {
			const dto = new CreateProductDto();
			dto.name = 'Name';
			dto.productToken = 'token';
			dto.price = 10;
			dto.stock = 2147483648; // Max int + 1

			const errors = await validate(dto);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0].property).toBe('stock');
		});
	});

	describe('UpdateStockDto', () => {
		it('should fail if stock is negative', async () => {
			const dto = new UpdateStockDto();
			dto.stock = -1;

			const errors = await validate(dto);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0].property).toBe('stock');
		});

		it('should fail if stock is too high', async () => {
			const dto = new UpdateStockDto();
			dto.stock = 2147483648;

			const errors = await validate(dto);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0].property).toBe('stock');
		});
	});
});
