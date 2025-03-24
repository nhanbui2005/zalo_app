import React, { useRef } from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import {useRoomList} from '~/hooks/Ui/useRoomList';
import ItemChatHome from '../roomItem';
import { useNavigation } from '@react-navigation/native';
import { UModalRef } from '~/components/Common/modal/UModal';
import { MainNavProp } from '~/routers/types';
import ModalContent_Conversation from '~/components/Common/modal/content/ModalContent_Conversation';

const RoomListView = () => {
  const mainNav = useNavigation<MainNavProp>();  
  const modalRef = useRef<UModalRef>(null);
  const {rooms, isLoading} = useRoomList();  
  
  if (!rooms || rooms.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Bắt dầy trò chuyền ngay</Text>
      </View>
    );
  }
  const handleLongItemPress = (pageY: number) => {
    modalRef.current?.open(
      <ModalContent_Conversation pageY={pageY}/>
    )
  };
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Danh sách phòng</Text>
      <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ItemChatHome
            key={item.id}
            room={item}
            onLongPress={pageY => handleLongItemPress(pageY)}
          />
        )}
      />
    </View>
  );
};

export default RoomListView

const styles = StyleSheet.create({
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1},
  header: {fontSize: 20, fontWeight: 'bold', margin: 10},
  roomItem: {padding: 10, borderBottomWidth: 1, borderColor: '#ccc'},
  groupName: {fontWeight: 'bold'},
  lastMsg: {color: '#666'},
  unreadCount: {color: 'red'},
});
