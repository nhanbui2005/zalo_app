import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntity } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';

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

  async createForMessage(messageId: Uuid, mediaData: any[], createdBy: Uuid) {
    const promises = mediaData.map(data => {
  
      const media = this.mediaRepository.create({
        url: data.url,
        publicId: data.public_id, // Ánh xạ từ public_id sang publicId
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
        duration: data.duration,
        previewUrl: data.preview_url,
        originalName: data.originalName,
        mimeType: data.mimeType,
        messageId,
        createdAt: new Date(),
        createdBy: SYSTEM_USER_ID,
        updatedAt: new Date(),
        updatedBy: SYSTEM_USER_ID
      });
      
      return this.mediaRepository.save(media);
    });
  
    return await Promise.all(promises);
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