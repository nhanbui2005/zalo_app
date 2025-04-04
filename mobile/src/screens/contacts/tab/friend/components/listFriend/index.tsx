import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MemberRepository from '~/database/repositories/MemberRepository';
import { UserItemView } from '~/database/types/user.typee';
import {RelationStatus} from '~/features/relation/dto/relation.dto.enum';
import { useUserList } from '~/hooks/Ui/useUserList';
import { MainNavProp, StackNames } from '~/routers/types';
import { colors } from '~/styles/Ui/colors';
import { imagesStyle } from '~/styles/Ui/image';
import { textStyle } from '~/styles/Ui/text';
import { MMKVStore } from '~/utils/storage';

const FriendListView: React.FC = () => {
  const mainNav = useNavigation<MainNavProp>();
  const memberRepo = MemberRepository.getInstance()
  const {users, isLoading} = useUserList(RelationStatus.FRIEND);
  
  const handleItemPartnerPress = async (userId: string) => {
    const roomId = await memberRepo.getRoomIdByUserIs(userId)
    if (!roomId) {
      console.log('not found roomId in listFriend');
      return
    }
    MMKVStore.setCurrentRoomId(roomId)
    mainNav.navigate(StackNames.ChatScreen)
  };

  // Hàm render từng item trong FlatList
  const renderFriend = (item: UserItemView) => {
    return (
      <TouchableOpacity
        style={[styles.userItem, {gap: 10, backgroundColor: 'white'}]}
        onPress={() => handleItemPartnerPress(item.id)}>
        <Image source={{uri: item.avatarUrl}} style={imagesStyle.avatar_50} />
        <Text style={textStyle.body_md}>{item.username}</Text>
      </TouchableOpacity>
    );
  };

  // Nếu đang tải dữ liệu, hiển thị thông báo loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        scrollEnabled={false}
        data={users} // Dữ liệu từ hook
        renderItem={({item}) => renderFriend(item)}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

// Styles dựa trên yêu cầu của bạn
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: colors.white,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    width: 24, // Giả lập iconSize.medium
    height: 24,
    resizeMode: 'contain',
  },
  chip: {
    ...textStyle.description_seen,
    textAlign: 'center',
    color: colors.gray_weight,
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
  },
  userItem: {
    backgroundColor: colors.white,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
});

export default FriendListView;