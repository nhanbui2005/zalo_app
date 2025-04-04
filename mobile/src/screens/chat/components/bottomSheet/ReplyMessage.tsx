import React, { forwardRef, useImperativeHandle, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useChatStore } from "~/stores/zustand/chat.store";
import { _MessageSentRes } from "~/features/message/dto/message.dto.parent";
import { colors } from "~/styles/Ui/colors";

export interface ReplyMessageRef {
  show: (isVisible: boolean, isReply: boolean) => void;
}

const ReplyMessageComponent = forwardRef<ReplyMessageRef>((_, ref) => {
  const { curentMessageRepling } = useChatStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isReply, setIsReply] = useState(false);

  useImperativeHandle(ref, () => ({
    show: (visible: boolean, reply: boolean) => {
      setIsVisible(visible);
      setIsReply(reply);
    },
  }));

  if (!isVisible || !curentMessageRepling) {
    return null;
  }

  const username = curentMessageRepling?.sender?.username || 'Unknown';

  return (
    <View style={styles.container}>
      <View style={{height: '100%', width: 3, backgroundColor: colors.secondary, borderRadius: 10}}/>
      <View style={styles.replyContainer}>
        <View style={styles.replyInfo}>
          <Text style={styles.replyLabel}>{username}</Text>
          <Text style={styles.senderName}>{curentMessageRepling.content}</Text>
        </View>
        <Text style={styles.messageContent} numberOfLines={1}>
          {curentMessageRepling.content}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => {
          setIsVisible(false);
          setIsReply(false);
        }}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 10,
    borderTopWidth: 1,
    gap: 10,
    borderTopColor: colors.gray_light,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_light,
    paddingHorizontal: 20
  },
  replyContainer: {
    flex: 1,
    marginRight: 10,
  },
  replyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyLabel: {
    color: colors.black,
    fontWeight: 'bold',
  },
  senderName: {
    color: colors.black,
    fontWeight: 'bold',
  },
  messageContent: {
    color: colors.black,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.black,
  },
});

export default ReplyMessageComponent;
