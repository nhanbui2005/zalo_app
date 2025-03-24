import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { MainNavProp } from '~/routers/types';
import { useNavigation } from '@react-navigation/native';
import { textStyle } from '../../styles/Ui/text';
import { colors } from '../../styles/Ui/colors';
import AppBar from '../../components/Common/AppBar';
import { WINDOW_WIDTH } from '../../utils/Ui/dimensions';
import { RelationStatus } from '~/features/relation/dto/relation.dto.enum';
import { Relation } from '~/features/relation/dto/relation.dto.nested';
import RequestItem from './components/RequestItem';
import { viewStyle } from '~/styles/Ui/views';
import { Fonts } from '~/styles/Ui/fonts';
import { useRelationStore } from '~/stores/zustand/relation.store';
import { InviterTypeEnum } from '~/features/user/dto/user.enum';
import { useSelector } from 'react-redux';
import { appSelector } from '~/features/app/appSlice';
import NetworkErrorScreen from '../others/NoConnectionScreen';

const HandleReqScreen = () => {
  const mainNav = useNavigation<MainNavProp>();
  const { networkState } = useSelector(appSelector);

  const {
    relations_Pending,
    fetchRelations,
    updateStatusRelation,
    clear_relations_Changing,
  } = useRelationStore();
  const [sent, setSent] = useState<Relation[]>([]);
  const [received, setReceived] = useState<Relation[]>([]);
  const [activeTab, setActiveTab] = useState(0)

  const underlinePosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (networkState && relations_Pending.length === 0) {
      fetchRelations(RelationStatus.PENDING);
    }
  }, [networkState]);

  useEffect(() => {
    if (relations_Pending.length > 0) {
      const sentData = relations_Pending.filter(
        (item: Relation) => item.inviter === InviterTypeEnum.SELF,
      );
      const receivedData = relations_Pending.filter(
        (item: Relation) => item.inviter !== InviterTypeEnum.SELF,
      );

      setSent(sentData);
      setReceived(receivedData);
    }
  }, [relations_Pending]);

  const tabs = [
    { id: 0, label: 'Đã nhận', data: received },
    { id: 1, label: 'Đã gửi', data: sent },
  ];

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    Animated.timing(underlinePosition, {
      toValue: index * (WINDOW_WIDTH / tabs.length),
      useNativeDriver: true,
      duration: 200,
    }).start();
  };

  const handleGoBack = () => {
    clear_relations_Changing();
    mainNav.goBack();
  };

  const handleSetOptionItem = (id: string, newStatus: RelationStatus) => {
    updateStatusRelation(id, newStatus);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <AppBar
        style={styles.appBar}
        title="Lời mời kết bạn"
        iconButtonLeft={['back']}
        iconButtonRight={['setting']}
        onPressInput={() => mainNav.navigate('SearchScreen')}
        onPress={action => {
          switch (action) {
            case 'back':
              handleGoBack();
              break;
            case 'setting':
              break;
          }
        }}
      />

      <View style={viewStyle.container}>
        {/* Tabs */}
        <Animated.View style={styles.tabContainer}>
          {tabs.map(tab => (
            <Pressable
              key={tab.id}
              style={styles.tab}
              onPress={() => handleTabPress(tab.id)}>
              <Text style={[activeTab === tab.id && styles.activeText]}>
                {tab.label}
              </Text>
              {/* Hiển thị badge cho tab "Đã gửi" nếu có dữ liệu */}
              {tab.id === 1 && tab.data.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.data.length}</Text>
                </View>
              )}
            </Pressable>
          ))}
          <Animated.View
            style={[
              styles.underline,
              {
                transform: [{ translateX: underlinePosition }],
                width: WINDOW_WIDTH / tabs.length,
              },
            ]}
          />
        </Animated.View>

        {/* Nội dung tab */}
        <View style={styles.contentContainer}>
          {networkState ? (
            tabs[activeTab].data.length > 0 ? (
              tabs[activeTab].data.map(relation => (
                <RequestItem
                  key={relation.id}
                  relation={relation}
                  itemOnPress={handleSetOptionItem}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Không có lời mời nào.</Text>
            )
          ) : (
            <NetworkErrorScreen  />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.gray_light,
  },
  appBar: {
    backgroundColor: colors.secondary,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    position: 'relative',
  },
  activeText: {
    ...textStyle.body_md,
    fontFamily: Fonts.roboto.medium,
    color: colors.secondary_dark,
  },
  underline: {
    position: 'absolute',
    bottom: -1,
    height: 2, // Tăng độ dày của gạch chân để giống hình
    backgroundColor: colors.black, // Đổi màu gạch chân thành đen
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.secondary_transparent,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 20,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
  },
  emptyText: {
    ...textStyle.body_md,
    color: colors.gray_weight,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default HandleReqScreen;