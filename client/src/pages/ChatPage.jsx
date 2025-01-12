import { useState } from 'react'
import ConversationInfo from './chatPage/ConversationInfo'
import ConversationList from './chatPage/ConversationList'
import ConversationContent from './chatPage/ConversationContent'
import { SocketProvider, useSocket } from '../socket/SocketProvider'

const ChatPage = () => {
  const [currentRoom, setCurrentRoom] = useState()
  // const { emit } = useSocket();
  
  return (
    // <SocketProvider namespace={"notifications"}>
      <div className="flex size-full flex-row bg-dark-2"><SocketProvider namespace={"message"}>
        {/* danh sách hội thoại */}
        <ConversationList setCurrentConversation={(it)=>setCurrentRoom(it)}/>
        {/* nội dung */}
        <div className="flex w-full flex-row">
          {/* hội thoại */}
          {
            currentRoom &&
            
              <ConversationContent
                avatarUrl={currentRoom?.roomAvatarUrl}
                name={currentRoom?.roomName}
                type={currentRoom?.type}
                roomId={currentRoom?.id}
              />
            
          }
          {/* thông tin hội thoại*/}
          <ConversationInfo/>
        </div></SocketProvider>
      </div>
    // </SocketProvider>
  )
}

export default ChatPage