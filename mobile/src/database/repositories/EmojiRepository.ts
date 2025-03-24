import { Q } from '@nozbe/watermelondb';
import Emoji from '../models/EmojiModel';
import { database } from '..';

export class EmojiRepository {
  private emojiCollection = database.collections.get<Emoji>('emojis');

  async addEmojis(emojis: { memberId: string; messageId: string; content: string; createdAt: Date }[]): Promise<void> {
    await database.action(async () => {
      for (const emojiData of emojis) {
        await this.emojiCollection.create((emoji: Emoji) => {
          emoji.memberId = emojiData.memberId;
          emoji.messageId = emojiData.messageId;
          emoji.content = emojiData.content;
          emoji.createdAt = emojiData.createdAt;
        });
      }
    });
  }

 // Xóa emoji theo messageId và memberId
 async deleteEmojiByMessageAndMember(messageId: string, memberId: string): Promise<void> {
    const emojisToDelete = await this.emojiCollection
      .query(Q.where('message_id', messageId), Q.where('member_id', memberId))
      .fetch();

    await database.action(async () => {
      for (const emoji of emojisToDelete) {
        await emoji.destroyPermanently();
      }
    });
  }

  async resetEmojisForMessage(
    messageId: string,
    serverEmojis: Array<{ userId: string; emoji: string; createdAt: Date }>
  ): Promise<void> {
    const localEmojis = await this.emojiCollection.query(Q.where('message_id', messageId)).fetch();

    const localEmojiSet = new Set(localEmojis.map(e => `${e.memberId}-${e.content}`));
    const serverEmojiSet = new Set(serverEmojis.map(e => `${e.userId}-${e.emoji}`));

    // Xác định emoji cần thêm và cần xóa
    const emojisToAdd = serverEmojis.filter(e => !localEmojiSet.has(`${e.userId}-${e.emoji}`));
    const emojisToRemove = localEmojis.filter(e => !serverEmojiSet.has(`${e.memberId}-${e.content}`));

    // Xóa các emoji không còn tồn tại
    for (const emoji of emojisToRemove) {
      await emoji.destroyPermanently();
    }

    // Thêm các emoji mới
    for (const emojiData of emojisToAdd) {
      await this.emojiCollection.create((emoji: Emoji) => {
        emoji.memberId = emojiData.userId;
        emoji.messageId = messageId;
        emoji.content = emojiData.emoji;
        emoji.createdAt = emojiData.createdAt;
      });
    }
  }
}