import { AuditActionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class AuditLogQueryDto {
  @IsOptional()
  @IsEnum(AuditActionType)
  actionType?: AuditActionType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  targetEntityId?: string;
}
