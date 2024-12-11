import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { OffsetPaginationDto } from './offset-pagination.dto';

export class OffsetPaginatedDto<TData> {
  @ApiProperty({ type: [Object] })
  @Expose()
  readonly data: TData[];

  @ApiProperty()
  @Expose()
  pagination: OffsetPaginationDto;

  constructor(data: TData[], meta: OffsetPaginationDto) {
    console.log('data', data[0]);
    this.data = data;
    this.pagination = meta;
  }
}
