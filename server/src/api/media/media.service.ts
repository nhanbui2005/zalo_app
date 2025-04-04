import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntity } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Uuid } from '@/common/types/common.type';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
  ) {}

  async create(createMediaDto: CreateMediaDto) {
    const media = this.mediaRepository.create(createMediaDto);
    return await this.mediaRepository.save(media);
  }

  async findAll() {
    return await this.mediaRepository.find();
  }

  async findOne(id: Uuid) {
    return await this.mediaRepository.findOne({ where: { id } });
  }

  async update(id: Uuid, updateMediaDto: UpdateMediaDto) {
    await this.mediaRepository.update(id, updateMediaDto);
    return await this.findOne(id);
  }

  async remove(id: Uuid) {
    return await this.mediaRepository.delete(id);
  }

  async createForMessage(messageId: Uuid, mediaData: Partial<MediaEntity>, createdBy: Uuid) {
    const media = this.mediaRepository.create({
      ...mediaData,
      messageId,
      createdBy,
    });
    return await this.mediaRepository.save(media);
  }

  async findMediaByMessageId(messageId: Uuid) {
    return await this.mediaRepository.find({
      where: { messageId },
    });
  }

  async removeMediaByMessageId(messageId: Uuid) {
    return await this.mediaRepository.delete({ messageId });
  }

  async copyMediaForReply(originalMediaId: Uuid, newMessageId: Uuid, createdBy: Uuid) {
    const originalMedia = await this.findOne(originalMediaId);
    if (!originalMedia) {
      return null;
    }

    // Create a new media entity with the same properties but different messageId
    const newMedia = this.mediaRepository.create({
      url: originalMedia.url,
      publicId: originalMedia.publicId,
      format: originalMedia.format,
      bytes: originalMedia.bytes,
      width: originalMedia.width,
      height: originalMedia.height,
      duration: originalMedia.duration,
      previewUrl: originalMedia.previewUrl,
      originalName: originalMedia.originalName,
      mimeType: originalMedia.mimeType,
      type: originalMedia.type,
      messageId: newMessageId,
      createdBy,
    });

    return await this.mediaRepository.save(newMedia);
  }
} 