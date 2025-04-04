import { useCallback, useEffect, useState } from "react";
import MessageRepository from "~/database/repositories/MessageRepository";
import UserRepository from "~/database/repositories/UserRepository";
import { CursorPaginatedRes, PageOptionsDto } from "~/features/common/pagination/paginationDto";
import { useChatStore } from "~/stores/zustand/chat.store";
import { MessageItemDisplay, MessageItemView } from "~/database/types/message.type";
import { MessageSource, MessageViewStatus } from "~/features/message/dto/message.enum";
import { UserItemBaseView } from "~/database/types/user.typee";
import { MMKVStore } from "~/utils/storage";

export const useMessageListWithInfiniteScroll = () => {
  const userRepo = UserRepository.getInstance();
  const messageRepo = MessageRepository.getInstance();

  const currentMemberMyId = MMKVStore.getCurrentMemberMeId();
  const currentRoomId = MMKVStore.getCurrentRoomId();

  const { curentPagination, setPagination } = useChatStore();
  const [originalMessages, setOriginalMessages] = useState<MessageItemView[]>([]); 
  const [messages, setMessages] = useState<MessageItemDisplay[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userMaps, setUserMaps] = useState<Map<string, UserItemBaseView>>(new Map());
  const LIMIT = 20;

  const mapToMessageItemDisplay = useCallback(
    (messages: MessageItemView[], usersMap: Map<string, UserItemBaseView>): MessageItemDisplay[] => {
      // Bước 1: Thêm sender và isSelfSent cho tất cả tin nhắn
      const messagesWithSender = messages.map((message) => {
        const sender = usersMap.get(message.senderId);
        return {
          ...message,
          sender: {
            id: message.senderId,
            username: sender?.username || "Unknown",
            preferredName: sender?.preferredName || "",
            avatarUrl: sender?.avatarUrl || "",
          },
          isSelfSent: message.senderId === currentMemberMyId,
        };
      });

      // Bước 2: Tính các thuộc tính hiển thị dựa trên mối quan hệ giữa các tin nhắn
      return messagesWithSender.map((message, index, array) => {
 
        const messageNext = index > 0 ? array[index - 1] : undefined;
        const messageBefore = index < array.length - 1 ? array[index + 1] : undefined;

        return {
          ...message,
          isSelfSent: message.isSelfSent,
          source: message.senderId ? MessageSource.PEOBLE : MessageSource.SYSTEM,
          messageStatus: message.status,
          status: message.status || MessageViewStatus.SENT,
          isDisplayAvatar: !message.isSelfSent && (messageBefore?.isSelfSent),
          isDisplayStatus: message.isSelfSent && index === 0,
          isDisplayTime: 
          (!message.isSelfSent && messageNext && messageNext.isSelfSent) ||
          (message?.isSelfSent && messageNext && !messageNext?.isSelfSent) ||
          index === 0,
          isDisplayHeart: (!message.isSelfSent && messageNext && messageNext.isSelfSent),
        };
      });
    },
    [currentMemberMyId]
  );

  useEffect(() => {
    if (!currentRoomId) {
      setOriginalMessages([]);
      setMessages([]);
      setHasMore(true);
      setPagination({ limit: LIMIT, afterCursor: undefined });
      setUserMaps(new Map());
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      setOriginalMessages([]);
      setMessages([]);
      setHasMore(true);
      setPagination({ limit: LIMIT, afterCursor: undefined });

      try {
        const fetchedUserMaps = await userRepo.getMapUsersByRoomId(currentRoomId);
        setUserMaps(fetchedUserMaps);

        const observable = messageRepo.getMessagesByRoomIdObservable(
          currentRoomId,
          fetchedUserMaps,
          curentPagination.afterCursor,
          curentPagination.beforeCursor
        );
        const subscription = observable.subscribe((newMessages) => {
          setOriginalMessages((prev) => {            
            // Thay vì lọc tin nhắn mới, chúng ta sẽ thay thế toàn bộ danh sách
            // để đảm bảo rằng các thay đổi ID được phát hiện
            const updatedOriginalMessages = [...newMessages];
            // Áp dụng mapToMessageItemDisplay cho toàn bộ danh sách
            const displayMessages = mapToMessageItemDisplay(updatedOriginalMessages, fetchedUserMaps);
            setMessages(displayMessages);
            return updatedOriginalMessages;
          });
          setIsLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [currentRoomId, mapToMessageItemDisplay]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentRoomId || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const pagination: PageOptionsDto = {
        limit: LIMIT,
        afterCursor: curentPagination.afterCursor,
        beforeCursor: curentPagination?.beforeCursor, 
      };

      const result: CursorPaginatedRes<MessageItemView> = await messageRepo.getMessages(
        currentRoomId,
        pagination,
        messageRepo
      );

      if (result.data.length > 0) {
        setOriginalMessages((prev) => {
          // Lọc tin nhắn mới để tránh trùng lặp
          const newMessages = result.data.filter((msg) => !prev.some((existing) => existing.id === msg.id));
          // Thêm tin nhắn mới vào danh sách gốc
          const updatedOriginalMessages = [...prev,...newMessages];
          // Áp dụng mapToMessageItemDisplay cho toàn bộ danh sách
          const displayMessages = mapToMessageItemDisplay(updatedOriginalMessages, userMaps);
          setMessages(displayMessages);
          return updatedOriginalMessages;
        });
        setHasMore(result.data.length === LIMIT);
        setPagination({ 
          limit: LIMIT,
           afterCursor: result.pagination.afterCursor,
           beforeCursor: result.pagination.beforeCursor 
          });
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentRoomId, curentPagination, isLoading, hasMore, userMaps, mapToMessageItemDisplay]);

  return { messages, isLoading, loadMoreMessages, hasMore };
};