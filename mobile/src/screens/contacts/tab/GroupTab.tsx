import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Assets} from '~/styles/Ui/assets';
import {colors} from '~/styles/Ui/colors';
import {viewStyle} from '~/styles/Ui/views';
import {textStyle} from '~/styles/Ui/text';
import {iconSize} from '~/styles/Ui/icons';
import {useNavigation} from '@react-navigation/native';
import {MainNavProp, StackNames} from '~/routers/types';
import {imagesStyle} from '~/styles/Ui/image';
import {RelationStatus} from '~/features/relation/dto/relation.dto.enum';
import {UserBase} from '~/features/user/dto/user.dto.nested';
import { relationApi } from '~/features/relation/relationApi';

const GroupTab = ({ onScrollY }) => {
  const mainNav = useNavigation<MainNavProp>();
  const [friends, setFriends] = useState<UserBase[]>([]);

 useEffect(() => {    
  const fetchFriends = async () => {
    try {
      const data = await relationApi.getRelations(RelationStatus.FRIEND);
      const friends = data.map(item => item.user).filter(user => !!user);
      setFriends(friends); 
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  fetchFriends(); 
}, []);

  const items = [
    {icon: Assets.icons.friend_white, label: 'Lời mời kết bạn'},
    {icon: Assets.icons.contract_list_white, label: 'Danh bạ máy'},
    {icon: Assets.icons.birth_white, label: 'Lịch sinh nhật'},
  ];

  const renderFriend = (item: UserBase) => (
    <TouchableOpacity
      style={[styles.userItem, {gap: 10, backgroundColor: 'white'}]}
      onPress={() => mainNav.navigate(StackNames.ChatScreen)}>
      <Image source={{uri: item.avatarUrl}} style={imagesStyle.avatar_50} />
      <Text style={textStyle.body_md}>{item.username}</Text>
    </TouchableOpacity>
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (onScrollY) {
      onScrollY(scrollY); 
    }
  };

  return (
    <ScrollView onScroll={handleScroll} style={styles.container}>
      <View style={{backgroundColor: 'white'}}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.itemRow}
            onPress={() => {
              mainNav.navigate(StackNames.HandleReqScreen);
            }}>
            <View style={styles.iconContainer}>
              <Image source={item.icon} style={styles.icon} />
            </View>
            <Text style={textStyle.body_md}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{backgroundColor: 'white',height: 56,justifyContent: 'center',padding: 10, marginTop: 4,borderBottomWidth: 1, borderColor: colors.gray_light}}>
        <View style={[viewStyle.container_row, {gap: 10}]}>
          <Text
            style={[
              styles.chip,
              {backgroundColor: colors.gray_light, fontWeight: 'bold'},
            ]}>
            Tất cả 10
          </Text>
          <Text style={styles.chip}>Mới truy cập 2</Text>
        </View>
      </View>

      <FlatList
        scrollEnabled={false} 
        data={friends}
        renderItem={({item}) => renderFriend(item)}
        keyExtractor={item => item.id}
      />
    </ScrollView>
  );
};

export default GroupTab;

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
    ...iconSize.medium,
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
