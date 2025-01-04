import { useEffect, useState } from 'react'
import { Assets } from '../assets'
import SquareIcon from '../components/icon/squareIcon'
import { AddFriendModal } from '../components/modal/AddFriendModal'
import roomAPI from '../service/roomAPI'
import messageAPI from '../service/messageAPI'

export default function ChatPage() {
  const [isInputFocus, setIsInputFocus] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [messages, setMessages] = useState([])
  const [isModalOpen, setIsModelOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentRoom, setCurrentRoom] = useState()

  const Search = () => {
    const [isFocus, setIsFocus] = useState(false)
    
    return (
      <div
        className={`${
          isFocus && 'outline outline-1 outline-sky-400'
        } flex w-full flex-row rounded-lg bg-dark-2 px-1`}
      >
        <SquareIcon src={Assets.icons.search} />
        <input
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          className="search-input w-full bg-dark-2 text-white focus:outline-none"
          placeholder="Tìm kiếm"
        />
      </div>
    )
  }
  const SelectedTab = () => {
    const items = ['Tất cả', 'Chưa đọc']
    const [isSelected, setIsSelected] = useState(items[0])
    return (
      <div className="flex gap-3">
        {items.map((item) => (
          <div className="" onClick={() => setIsSelected(item)}>
            <p
              className={`text-sm font-semibold hover:text-blue-500 ${isSelected === item ?  'text-blue-500' : 'text-slate-400'}`}
            >
              {item}
            </p>
            {isSelected === item && <div className="h-1 bg-blue-500" />}
          </div>
        ))}
      </div>
    )
  }
  const SendMessage = (userId, message) => {
    const itemMessage = {
      id: 1,
      userId: userId,
      message: message,
      sentAt: '1 phút',
    }
    setMessages([...messages, itemMessage])
    setTextContent('')
  }
  const ConversationItem = ({ id, avatarUrl, name, lastText, messLasted, onClick }) => {
    const [isHover, setIsHover] = useState(false)
    return (
      <div
        className="flex h-20 w-full flex-row p-2 hover:bg-dark-4 items-center"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onClick={()=>onClick(id)}
      >
        <img
          className="rounded-full size-12"
          src={avatarUrl}
          alt="Placeholder"
        />
        <div className="mx-2 flex w-full gap-1 flex-col py-1">
          <div className="flex flex-row justify-between">
            <p className="text-base text-white">{name}</p>
            {isHover ? (
              <SquareIcon className={'size-6'} src={Assets.icons.more} />
            ) : (
              <p className="text-slate-400 text-sm">{messLasted}</p>
            )}
          </div>
          <p className="text-slate-400">{lastText}</p>
        </div>
      </div>
    )
  }
  const MessageItem = ({ data }) => {
    const {content, type, status, sender, isSelfSent, createdAt} = data
    return (
      <div className={`my-10 flex ${isSelfSent && 'flex-row-reverse'}`}>
        <img
          className="size-8 rounded-full"
          src={sender.user.avatarUrl}
          alt="Placeholder"
        />
        <p className="max-w-80 break-words text-white">{isSelfSent}</p>
        <div
          className={`rounded bg-slate-500 p-2 ${!isSelfSent ? 'ml-2' : 'mr-2'}`}
        >
          <p className="max-w-80 break-words">{content}</p>
        </div>
      </div>
    )
  }

  const onItemRoomClick = (id) =>{

  }

  const fetchConversations = async () => {
    const data = await roomAPI.getAllRoomAPI()    
    setConversations(data.data)
    setCurrentRoom(data.data[0])
  }

  const fetchLoadMoreMessages = async () => {
    const data = await messageAPI.loadMoreMessage({
      roomId: currentRoom.id
    })
    setMessages(data.data)
  }
  

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (currentRoom) {
      fetchLoadMoreMessages()
    }
  }, [currentRoom])
  

  return (
    <div className="flex size-full flex-row bg-dark-2">
      {/* danh sách hội thoại */}
      <div className="flex w-[28rem] flex-col">
        {/* header */}
        <div className="mb-0.5 flex h-28 flex-col justify-between bg-dark-3 px-4 pt-4">
          <div className="flex flex-row">
            <Search />
            <SquareIcon onClick={()=>setIsModelOpen(true)} src={Assets.icons.addFriend} className={'mx-1'} />
            <SquareIcon src={Assets.icons.addGroup} />
            <AddFriendModal isOpen={isModalOpen} setIsOpen={setIsModelOpen}/>
          </div>
          <SelectedTab />
        </div>
        {/* content */}
        <div className="flex-grow bg-dark-3">
          {conversations.map((item, index) => (
            <ConversationItem
              key={index.toString()}
              avatarUrl={item.roomAvatarUrl}
              name={item.roomName}
              lastText={'hello'}
              messLasted={'1h trước'}
              onClick={onItemRoomClick}
            />
          ))}
        </div>
      </div>

      {/* nội dung */}
      <div className="flex w-full flex-row">
        {/* hội thoại */}
        <div className="mx-0.5 flex w-full flex-col">
          {/* header */}
          <div className="flex h-20 flex-row items-center bg-dark-3 p-4">
            <div className="flex w-full flex-row items-center">
              <img
                className="size-12 rounded-full"
                src={currentRoom?.roomAvatarUrl}
                alt="Placeholder"
              />
              <div className="mx-3 flex w-full flex-col justify-between py-1">
                <p className="text-lg font-bold text-cyan-50">{currentRoom?.roomName}</p>
                <p className="text-sm text-slate-400">Truy cập 1 giờ trước</p>
              </div>
            </div>
            <SquareIcon src={Assets.icons.call} />
            <SquareIcon src={Assets.icons.videoCall} />
            <SquareIcon src={Assets.icons.addGroup} />
          </div>
          {/* nội dung hội thoại */}
          <div className="h-full overflow-auto p-8 scrollbar-hide">
            {[...messages].reverse().map((item) => {
              return (
                <MessageItem
                  data={item}
                />
              )
            })}
          </div>
          {/* nhập tin nhắn */}
          <div
            className={`${isInputFocus ? 'bg-blue-600' : 'bg-dark-2'} mt-0.5 flex flex-col gap-0.5`}
          >
            <div className="h-8 w-full bg-dark-3 px-2"></div>
            <div className="flex flex-row items-center justify-center bg-dark-3 px-4 h-12">
              <input
                className="w-full bg-dark-3 text-base text-cyan-50 focus:outline-none"
                placeholder="Nhập @, tin nhắn..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onFocus={() => setIsInputFocus(true)}
                onBlur={() => setIsInputFocus(false)}
              />
              <img
                className="size-6"
                src={
                  textContent.length > 0 ? Assets.icons.send : Assets.icons.like
                }
                onClick={() => {
                  textContent.length > 0 && SendMessage(2, textContent)
                }}
              />
            </div>
          </div>
        </div>
        {/* thông tin hội thoại*/}
        <div className="flex w-[30rem] flex-col bg-dark-3">
          <div className="flex h-20 flex-col items-center justify-center bg-dark-3">
            <p className="text-lg font-bold text-cyan-50">
              Thông tin hội thoại
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
var user1 = {
  id: 1,
  name: 'Nguyễn Văn A',
  image: 'https://via.placeholder.com/150',
}
var me = {
  id: 1,
  name: 'Nguyễn Văn A',
  image: 'https://via.placeholder.com/150',
}
