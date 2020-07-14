import { JwtAuthGuard } from './jwt-auth.guard';
import any = jasmine.any;
import { Reflector } from '@nestjs/core';

describe('AuthGuard', () => {
    it('should be defined', () => {
        expect(new JwtAuthGuard(new Reflector())).toBeDefined();
    });
});
