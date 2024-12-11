import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export async function paginate<T extends ObjectLiteral>(
  builder: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  options?: Partial<{
    skipCount: boolean;
    takeAll: boolean;
  }>,
): Promise<[T[], OffsetPaginationDto]> {
  if (!options?.takeAll) {
    builder.skip(pageOptionsDto.offset).take(pageOptionsDto.limit);
  }

  // if (pageOptionsDto._sort.length > 0) {
  //   pageOptionsDto._sort.map(item => {
  //     builder.orderBy(item.field,item.order)
  //   })
  // }

  const entities: T[] = await builder.getMany();

  let count = -1;

  if (!options?.skipCount) {
    count = await builder.getCount();
  }

  const metaDto = new OffsetPaginationDto(count, pageOptionsDto);

  return [entities, metaDto];
}
