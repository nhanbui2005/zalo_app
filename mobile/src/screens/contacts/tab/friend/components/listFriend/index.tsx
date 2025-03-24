import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserItemView } from '~/database/types/user.typee';
import {RelationStatus} from '~/features/relation/dto/relation.dto.enum';
import { useUserList } from '~/hooks/Ui/useUserList';

// Định nghĩa colors (giả lập, bạn có thể thay bằng colors thực tế từ dự án)
const colors = {
  white: '#FFFFFF',
  gray_weight: '#666666',
  secondary: '#E0E0E0',
};

// Định nghĩa textStyle và imagesStyle (giả lập, thay bằng style thực tế nếu có)
const textStyle = {
  body_md: {fontSize: 16, color: '#000000'},
  description_seen: {fontSize: 14},
};

const imagesStyle = {
  avatar_50: {width: 50, height: 50, borderRadius: 25},
};

// Định nghĩa interface UserBase nếu chưa có
interface UserBase {
  id: string;
  username: string;
  avatarUrl: string;
}

const FriendListView: React.FC = () => {
  const {users, isLoading} = useUserList(RelationStatus.FRIEND);
  
  const handleItemPartnerPress = (userId: string) => {
    console.log(`Pressed user with ID: ${userId}`);
    // Thêm logic chuyển màn hình hoặc xử lý tại đây
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