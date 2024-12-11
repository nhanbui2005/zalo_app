import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RelationEntity } from './entities/relation.entity';

@Injectable()
export class RelationRepository extends Repository<RelationEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(RelationEntity, dataSource.createEntityManager());
  }
}
