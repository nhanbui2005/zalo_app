import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type MainStackParamList = {
  Main: undefined;
  SearchScreen: undefined;
  ChatScreen: { id: string };
  AddFriendScreen: undefined;
};
export type MainNavProp = NativeStackNavigationProp<MainStackParamList, 'Main'>;



export type TabParamList = {
  HomeTab: undefined;
  ContactsTab: undefined;
  DiaryTab: undefined;
  PersonalTab: undefined;
};

