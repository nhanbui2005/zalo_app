import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import React from 'react';
import {Assets} from '~/styles/Ui/assets';
import {colors} from '~/styles/Ui/colors';
import {viewStyle} from '~/styles/Ui/views';
import {textStyle} from '~/styles/Ui/text';
import {iconSize} from '~/styles/Ui/icons';
import {useNavigation} from '@react-navigation/native';
import {MainNavProp, StackNames} from '~/routers/types';
import { useDispatch } from 'react-redux';
import FriendListView from './components/listFriend';

const FriendTab = ({ onScrollY }) => {
  const mainNav = useNavigation<MainNavProp>();
  const dispath = useDispatch()

  const items = [
    {icon: Assets.icons.friend_white, label: 'Lời mời kết bạn'},
    {icon: Assets.icons.contract_list_white, label: 'Danh bạ máy'},
    {icon: Assets.icons.birth_white, label: 'Lịch sinh nhật'},
  ];

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
      <View style={{backgroundColor: colors.white, height: 400}}></View>
      
      <FriendListView/>

      <View style={{backgroundColor: colors.white, height: 60}}></View>

    </ScrollView>
  );
};

export default FriendTab;

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
