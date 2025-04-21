import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseProfilePagram, ProfilePersonalPagram } from "./main/mainPagramTypes";
import { Relation } from "~/features/relation/dto/relation.dto.nested";
import PDFViewerScreen from "~/screens/chat/components/message-types/files/PDFViewerScreen";

export type MainStackParamList = {
  Main: {newFriend: Relation};
  SearchScreen: undefined;
  ChatScreen: undefined
  AddFriendScreen: undefined;
  ProfilePersonalScreen: { profile: ProfilePersonalPagram }
  SenAddFriendScreen: {baseProfile: BaseProfilePagram}
  OptionalFriendScreen: {baseProfile: BaseProfilePagram}
  HandleReqScreen: undefined
  FullScreenVideo: {videoUrl: string}
  PDFViewerScreen: {pdfUrl: string}
};
export const StackNames = {
  Main: 'Main',
  SearchScreen: 'SearchScreen',
  ChatScreen: 'ChatScreen',
  AddFriendScreen: 'AddFriendScreen',
  ProfilePersonalScreen: 'ProfilePersonalScreen',
  SenAddFriendScreen: 'SenAddFriendScreen',
  HandleReqScreen: 'HandleReqScreen',
  OptionalFriendScreen: 'OptionalFriendScreen',
  PDFViewerScreen: 'PDFViewerScreen',
  FullScreenVideo: 'FullScreenVideo',
} as const;

export type MainNavProp = NativeStackNavigationProp<MainStackParamList, 'Main'>;


export type TabNames = {
  HomeTab: "Home";
  ContactsTab: "Contacts";
  DiaryTab: "Diary";
  PersonalTab: "Personal";
};

