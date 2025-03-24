import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";

interface GroupAvatarProps {
  roomAvatar: string;
}

const Avatar: React.FC<GroupAvatarProps> = ({ roomAvatar }) => {
  const roomAvatarUrls = roomAvatar ? roomAvatar.split('|') : [];
  const maxAvatars = 4;
  const displayedAvatars = roomAvatarUrls.slice(0, maxAvatars);

  if (roomAvatarUrls.length <= 1) {
    return (
      <Image
        style={imagesStyle.avatar_50}
        source={{ uri: roomAvatarUrls[0] || '' }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {displayedAvatars.map((uri, index) => (
        <Image key={index} source={{ uri }} style={[styles.avatar, getPosition(index)]} />
      ))}
      {roomAvatarUrls.length > maxAvatars && (
        <View style={[styles.moreAvatar, getPosition(maxAvatars - 1)]}>
          <Text style={styles.moreText}>+{roomAvatarUrls.length - maxAvatars}</Text>
        </View>
      )}
    </View>
  );
};

// Hàm tính toán vị trí của ảnh dựa trên index
const getPosition = (index: number) => {
  const positions = [
    { top: 0, left: 0 },
    { top: 0, right: 10 },
    { bottom: 0, left: 0 },
    { bottom: 0, right: 0 },
  ];
  return positions[index] || {};
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    position: "relative",
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  moreAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  moreText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

// Giả định imagesStyle đã được định nghĩa ở đâu đó
const imagesStyle = StyleSheet.create({
  avatar_50: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});

export default Avatar;