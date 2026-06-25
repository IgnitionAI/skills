# Implementation: HTTP Handler — TypeScript (NestJS)

> **Design Structure Guide — typescript**
>
> This document shows how the Clean Architecture pattern maps to typescript syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```typescript
// src/interface/http/order-controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderUseCase, CreateOrderRequest } from '../../application/use-cases/create-order';
import { GetOrderUseCase } from '../../application/use-cases/get-order';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders';

@ApiTags('Orders')
@Controller('api/v1/orders')
export class OrderController {
  constructor(
    private createOrderUC: CreateOrderUseCase,
    private getOrderUC: GetOrderUseCase,
    private listOrdersUC: ListOrdersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(@Body() dto: CreateOrderRequestDto) {
    const result = await this.createOrderUC.execute(dto);
    return { data: result, status: 'success' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.getOrderUC.execute({ orderId: id });
    if (!result) throw new NotFoundException('Order not found');
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.listOrdersUC.execute({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }
}

// Request DTO with validation decorators
import { IsUUID, IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) price: number;
}

export class CreateOrderRequestDto {
  @IsUUID() userId: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

### Middleware (Global Error Handler)
```typescript
// src/interface/http/middleware/error-filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = error instanceof HttpException
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const code = this.mapErrorCode(error);

    response.status(status).json({
      error: code,
      message: error.message,
      // No stack trace in production
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    });
  }

  private mapErrorCode(error: Error): string {
    const name = error.constructor.name;
    const map: Record<string, string> = {
      'UserNotFoundError': 'NOT_FOUND',
      'EmptyOrderError': 'DOMAIN_ERROR',
      'ValidationError': 'VALIDATION',
    };
    return map[name] || 'INTERNAL';
  }
}
```

### Module Registration
```typescript
// src/app.module.ts
@Module({
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
    { provide: APP_FILTER, useClass: GlobalErrorFilter },
  ],
})
export class AppModule {}
```
