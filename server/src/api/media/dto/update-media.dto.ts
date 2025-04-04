import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Uuid } from '@/common/types/common.type';

export class UpdateMediaDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  publicId?: string;

  @IsString()
  @IsOptional()
  format?: string;

  @IsNumber()
  @IsOptional()
  bytes?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  previewUrl?: string;

  @IsString()
  @IsOptional()
  originalName?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsUUID()
  @IsOptional()
  updatedBy?: Uuid;
} 