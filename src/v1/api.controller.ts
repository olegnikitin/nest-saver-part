import { Controller, UseFilters, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { ErrorFilter } from '../errors.filter';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
@UseFilters(new ErrorFilter())
export abstract class ApiController {}
