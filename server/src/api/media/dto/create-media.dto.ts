import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Uuid } from '@/common/types/common.type';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  publicId: string;

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
  createdBy?: Uuid;
} 