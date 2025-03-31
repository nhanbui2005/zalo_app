import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { UModalRef } from '~/components/Common/modal/UModal';
import { useMessageListWithInfiniteScroll } from '~/hooks/Ui/useMessageListWithInfiniteScroll';
import ItemMessage from '../ItemMessage';
import { ReplyMessageRef } from '../bottomSheet/ReplyMessage';
import { _MessageSentRes } from '~/features/message/dto/message.dto.parent';
import ModalContent_MenuMessage, { KeyItemMenu } from '~/components/Common/modal/content/ModelContent_MenuMessage';
import { useChatStore } from '~/stores/zustand/chat.store';

const MessageListView = () => {
  const { curentMessageRepling, setCurentMessageRepling } = useChatStore();
  const modalRef = useRef<UModalRef>(null);
  const currenMessageReplyingRef = useRef<any>(curentMessageRepling);
  const replyingRef = useRef<ReplyMessageRef>(null);
  const messageSelectedRef = useRef<_MessageSentRes>();
  const { messages, isLoading, loadMoreMessages, hasMore } = useMessageListWithInfiniteScroll();

  const handleLongItemPress = (pageY: number, message: any) => {
    messageSelectedRef.current = message;
    modalRef.current?.open(
      <ModalContent_MenuMessage
        pageY={pageY}
        message={message}
        onItemPress={handleItemMenuMessage}
      />
    );
  };

  const handleItemMenuMessage = (key: KeyItemMenu) => {
    if (key === KeyItemMenu.REPLY) {
      replyingRef.current?.show(
        messageSelectedRef.current?.sender?.user.username ?? 'Unknown',
        messageSelectedRef.current?.content ?? ''
      );
      currenMessageReplyingRef.current = messageSelectedRef.current;
      setCurentMessageRepling(currenMessageReplyingRef.current);
      modalRef.current?.close();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Danh sách phòng</Text>
      {isLoading && messages.length === 0 ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingContainer} />
      ) : (
        <FlatList
          inverted
          data={messages}
          initialNumToRender={20}
          onEndReached={hasMore ? () => loadMoreMessages() : undefined}
          onEndReachedThreshold={0.4}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <ItemMessage
              key={item.id}
              message={item}
              onLongPress={(pageY) => handleLongItemPress(pageY, item)}
            />
          )}
        />
      )}
    </View>
  );
};

export default MessageListView;

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: { fontSize: 20, fontWeight: 'bold', margin: 10 },
});
