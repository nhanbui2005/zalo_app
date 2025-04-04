import React, { useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { UModalRef } from '~/components/Common/modal/UModal';
import UModal from '~/components/Common/modal/UModal';
import { useMessageListWithInfiniteScroll } from '~/hooks/Ui/useMessageListWithInfiniteScroll';
import ItemMessage from '../ItemMessage';
import { _MessageSentRes } from '~/features/message/dto/message.dto.parent';
import { MessageItemDisplay } from '~/database/types/message.type';

interface Props {
  onLongItemPress?: (pageY: number, message: MessageItemDisplay) => void;
}

const MessageListView: React.FC<Props> = ({ onLongItemPress }) => {
  const modalRef = useRef<UModalRef>(null);
  const { messages, isLoading, loadMoreMessages, hasMore } = useMessageListWithInfiniteScroll();  

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
              message={item}
              onLongPress={(pageY) => onLongItemPress?.(pageY, item)}
            />
          )}
        />
      )}
      <UModal ref={modalRef} />
    </View>
  );
};

export default MessageListView;

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: { fontSize: 20, fontWeight: 'bold', margin: 10 },
});
