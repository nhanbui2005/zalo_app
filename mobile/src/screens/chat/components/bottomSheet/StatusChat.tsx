import {StyleSheet, Text, View} from 'react-native';
import React, { useState } from 'react';
import { textStyle } from '~/styles/Ui/text';
import { colors } from '~/styles/Ui/colors';
import useSocketEvent from '~/hooks/useSocket ';
import { useChatStore } from '~/stores/zustand/chat.store';

interface WritingSocket{
    memberId:string,
    status: boolean
}
interface Props {
  isGroup: boolean
}
const StatusChat = (props: Props) => {
  const {memberWriting} = useChatStore()
  const content = props.isGroup ? `${memberWriting}Đang soạn tin` : `Đang soạn tin...`
  return (
    <>{memberWriting && <Text style={styles.isChating}>{content}</Text>}</>
  );
};

export default StatusChat;

const styles = StyleSheet.create({
  isChating: {
    ...textStyle.body_sm,
    backgroundColor: colors.gray,
    color: colors.secondary,
    position: 'absolute',
    paddingHorizontal: 6,
    borderTopRightRadius: 4,
    bottom: 50,
  },
});
