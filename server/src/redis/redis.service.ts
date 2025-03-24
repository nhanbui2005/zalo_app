// redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '@/redis/config/redis-config.type';
import Redis from 'ioredis';

type ChainableCommander = ReturnType<Redis['multi']>;
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = this.configService.get<RedisConfig>('redis');

    this.client = new Redis({
      host: redisConfig.host || 'localhost',
      port: redisConfig.port || 6379,
      password: redisConfig.password || undefined,
      tls: redisConfig.tlsEnabled ? {} : undefined,
    });

    this.client.on('connect', () => console.log('Connected to Redis successfully'));
    this.client.on('error', (error) => {
      console.error('Failed to connect to Redis:', error);
      throw error;
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // --- String Commands ---
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (ttl) {
      return await this.client.set(key, value, 'EX', ttl);
    }
    return await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return await this.client.del(...keys);
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return await this.client.mget(...keys);
  }

  async mset(args: [string, string][]): Promise<string> {
    return await this.client.mset(...args.flat());
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  async exists(...keys: string[]): Promise<number> {
    return await this.client.exists(...keys);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // --- Set Commands ---
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.client.sadd(key, ...members);
  }
  // Phương thức mới: Trả về Multi thay vì thực thi ngay
  async setOverrideByUserId(multi: ChainableCommander, key: string, newValue: string): Promise<ChainableCommander> {
    let newValueObj;
    try {
      newValueObj = JSON.parse(newValue);
    } catch (e) {
      console.error(`Invalid newValue format for key ${key}:`, e);
      return multi;
    }
  
    const userId = newValueObj.userId;
    if (!userId) {
      console.error(`No userId found in newValue for key ${key}`);
      return multi;
    }
  
    const members = await this.client.smembers(key);
    let existingMemberObj: any = null;
  
    // Tìm member cũ
    for (const member of members) {
      try {
        const memberObj = JSON.parse(member);
        if (memberObj.userId === userId) {
          existingMemberObj = memberObj;
          multi.srem(key, member); // Xóa member cũ
          break;
        }
      } catch (e) {
        console.error(`Error parsing member in set ${key}:`, e);
        continue;
      }
    }
  
    // Nếu isOnline = true và có member cũ, giữ lastOnline
    if (newValueObj.isOnline === true && existingMemberObj) {
      const updatedMember = {
        ...existingMemberObj, // Giữ các trường cũ (bao gồm lastOnline)
        isOnline: true,       // Cập nhật isOnline
      };
      multi.sadd(key, JSON.stringify(updatedMember)); // Thêm member đã cập nhật
    } else {
      multi.sadd(key, newValue); // Thêm newValue như cũ nếu không thỏa điều kiện
    }
  
    return multi;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.client.sismember(key, member);
  }

  async scard(key: string): Promise<number> {
    return await this.client.scard(key);
  }

  // --- Hash Commands ---
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hset(key, field, value);
  }

  async hmset(key: string, data: Record<string, string>): Promise<string> {
    return await this.client.hmset(key, data);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hget(key, field);
  }

  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    return await this.client.hmget(key, ...fields);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hdel(key, ...fields);
  }

  async hlen(key: string): Promise<number> {
    return await this.client.hlen(key);
  }

  // --- List Commands ---
  async lpush(key: string, ...elements: string[]): Promise<number> {
    return await this.client.lpush(key, ...elements);
  }

  async rpush(key: string, ...elements: string[]): Promise<number> {
    return await this.client.rpush(key, ...elements);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  // --- Key Commands ---
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  async persist(key: string): Promise<number> {
    return await this.client.persist(key);
  }

  // --- Utility ---
  async flushall(): Promise<string> {
    return await this.client.flushall();
  }

  
  // --- Thêm hỗ trợ multi (pipeline) ---
  multi(): ChainableCommander {
    return this.client.multi();
  }
  async execPipeline(pipeline: ChainableCommander): Promise<any[]> {
    return await pipeline.exec();
  }

  getClient(): Redis {
    return this.client;
  }
  
}