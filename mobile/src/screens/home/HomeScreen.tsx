import React, { useEffect, useRef} from 'react';
import {View } from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {MainNavProp, StackNames} from '../../routers/types';
import AppBar, {Actions} from '../../components/Common/AppBar';
import {_GetAllRoomRes} from '~/features/room/dto/room.dto.parent';
import {_MessageSentRes} from '~/features/message/dto/message.dto.parent';
import UModal, { UModalRef } from '~/components/Common/modal/UModal';
import RoomListView from './components/roomList';
import { MMKVStore } from '~/utils/storage';

const HomeScreen = () => {
  const mainNav = useNavigation<MainNavProp>();
  const modalRef = useRef<UModalRef>(null);
  const isFocused = useIsFocused();

  useEffect(() => {          
    if (isFocused) {
      MMKVStore.setAllowNotification(false); 
    }
    return () => MMKVStore.setAllowNotification(true);
  }, [isFocused]);
  
  const goToSearchScreen = () => {
    mainNav.navigate(StackNames.SearchScreen);
  };

  const handleAppBarPress = (action: Actions) => {
    switch (action) {
      case 'search':
        goToSearchScreen();
        break;
      case 'bell':
        break;
      case 'setting':
        break;
    }
  };

  return (
    <View style={{backgroundColor: 'white', flex: 1}}>
      <UModal ref={modalRef}/>

      {/* AppBar */}
      <AppBar
        iconButtonLeft={['search']}
        iconButtonRight={['bell', 'setting']}
        inputSearch={false}
        onChangeInputText={text => console.log('Input changed:', text)}
        onPressInput={() => goToSearchScreen()}
        onPress={action => {
          handleAppBarPress(action);
        }}
      />
      {/* Danh sách chat */}
      <RoomListView/>
      {/* <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ItemChatHome
            key={item.id}
            room={item}
            onLongPress={pageY => handleLongItemPress(pageY)}
          />
        )}
      /> */}
    </View>
  );
};

export default HomeScreen;
