import { useCallback, useEffect, useState } from "react";
import MessageRepository from "~/database/repositories/MessageRepository";
import UserRepository from "~/database/repositories/UserRepository";
import { CursorPaginatedRes, PageOptionsDto } from "~/features/common/pagination/paginationDto";
import { _MessageSentRes } from "~/features/message/dto/message.dto.parent";
import { useChatStore } from "~/stores/zustand/chat.store";
import { useRoomStore } from "~/stores/zustand/room.store";
import UserModel from "~/database/models/UserModel";
import { MessageItemDisplay, MessageItemView } from "~/database/types/message.type";
import { MessageContentType, MessageSource, MessageViewStatus } from "~/features/message/dto/message.enum";
import { useSelector } from "react-redux";
import { appSelector } from "~/features/app/appSlice";

export const useMessageListWithInfiniteScroll = () => {
  const userRepo = new UserRepository();
  const { currentRoomId } = useRoomStore();
  const messageRepo = new MessageRepository();
  const {meData} = useSelector(appSelector)
  const [messages, setMessages] = useState<MessageItemDisplay[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, UserModel>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [afterCursor, setAfterCursor] = useState<number | undefined>(undefined);
  const { curentPagination, setPagination } = useChatStore();

  const LIMIT = 20;

  // Hàm chuyển MessageItemView thành MessageItemDisplay và tính các thuộc tính hiển thị
  const mapToMessageItemDisplay = (
    messages: MessageItemView[],
    usersMap: Map<string, UserModel>
  ): MessageItemDisplay[] => {
    // Bước 1: Thêm sender và isSelfSent cho tất cả tin nhắn
    const messagesWithSender = messages.map((message) => {
      const sender = usersMap.get(message.senderId);
      return {
        ...message,
        sender: {
          id: message.senderId,
          name: sender?.username || "Unknown",
          avatar: sender?.avatarUrl || "",
        },
        isSelfSent: message.senderId === meData?.id,
      };
    });

    // Bước 2: Tính các thuộc tính hiển thị dựa trên isSelfSent
    return messagesWithSender.map((message, index, array) => {
      const isDisplayHeart = message.senderId && !message.isSelfSent
      ? (array[index - 1]?.isSelfSent || index === 0) &&
        (index === array.length - 1 || message.type !== MessageContentType.TEXT)
      : undefined;
      return {
        ...message,
        isSelfSent: message.isSelfSent,
        sender: message.sender,
        source: message.senderId ? MessageSource.PEOBLE : MessageSource.SYSTEM,
        messageStatus: message.status,
        status: message.status,
        isDisplayAvatar: !message.isSelfSent && array[index + 1]?.isSelfSent,
        isDisplayStatus: message.isSelfSent && index === 0,
        isDisplayTime:
          message.senderId ? (index === array.length - 1 || message.type !== MessageContentType.TEXT): false,

        isDisplayHeart
      };
    });
  };

  // Hàm tải thêm tin nhắn
  const loadMoreMessages = useCallback(async () => {
    if (!currentRoomId || isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const pagination: PageOptionsDto = {
        limit: LIMIT,
        afterCursor: curentPagination?.afterCursor,
      };

      const result: CursorPaginatedRes<MessageItemView> = await messageRepo.getMessages(
        currentRoomId,
        pagination,
        messageRepo
      );

      setPagination(result.pagination);
      console.log('Pagination:', result.pagination);

      if (result.data.length > 0) {
        setMessages((prev) => {
          const newMessages = result.data
            .filter((msg) => !prev.some((existing) => existing.id === msg.id));
          const mappedMessages = mapToMessageItemDisplay(newMessages, usersMap);
          return [...prev, ...mappedMessages];
        });

        setHasMore(
          result.data.length === LIMIT &&
            (result.pagination.totalRecords ?? 0) > messages.length + result.data.length
        );
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentRoomId, curentPagination, usersMap, messages.length, isLoading, hasMore]);

  // Theo dõi thay đổi realtime và tải dữ liệu ban đầu
  useEffect(() => {
    if (!currentRoomId) {
      setMessages([]);
      setUsersMap(new Map());
      setPagination({ limit: LIMIT });
      setHasMore(true);
      return;
    }

    setIsLoading(true);
    setMessages([]);
    setPagination({ limit: LIMIT });
    setHasMore(true);

    // Lấy danh sách user trong phòng
    const fetchUsersAndMessages = async () => {
      try {
        const users = await userRepo.getMapUsersByRoomId(currentRoomId);
        setUsersMap(users);

        // Tải dữ liệu ban đầu
        await loadMoreMessages();

        // Theo dõi realtime updates (chỉ thêm tin nhắn mới)
        const observable = messageRepo.getMessagesByRoomIdObservable(currentRoomId, afterCursor);
        const subscription = observable.subscribe((newMessages) => {
          setMessages((prev) => {
            const latestMessages = newMessages
              .filter((msg) => !prev.some((existing) => existing.id === msg.id));
            const mappedMessages = mapToMessageItemDisplay(latestMessages, usersMap);
            return [...mappedMessages, ...prev].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
          setIsLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error fetching users or messages:', error);
        setIsLoading(false);
      }
    };

    fetchUsersAndMessages();
  }, [currentRoomId]);

  return { messages, isLoading, loadMoreMessages, hasMore };
};