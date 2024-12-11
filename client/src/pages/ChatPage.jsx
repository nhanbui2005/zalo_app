import { useState } from 'react'
import { Assets } from '../assets'
import SquareIcon from '../components/icon/squareIcon'

export default function ChatPage() {
  const [isInputFocus, setIsInputFocus] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [messages, setMessages] = useState(conversation)

  const Search = () => {
    const [isFocus, setIsFocus] = useState(false)
    return (
      <div
        className={`${
          isFocus && 'outline outline-1 outline-sky-400'
        } flex w-full flex-row rounded-lg bg-black px-1`}
      >
        <SquareIcon src={Assets.icons.search} />
        <input
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          className="search-input w-full bg-black text-white focus:outline-none"
          placeholder="Tìm kiếm"
        />
      </div>
    )
  }
  const SelectedTab = () => {
    const items = ['Tất cả', 'Chưa đọc']
    const [isSelected, setIsSelected] = useState(items[0])
    return (
      <div className="flex gap-2">
        {items.map((item) => (
          <div className="" onClick={() => setIsSelected(item)}>
            <p
              className={`text-lg font-bold hover:text-blue-500 ${isSelected === item && 'text-blue-500'}`}
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
  const ConversationItem = ({ type, image, name, lastText, messLasted }) => {
    const [isHover, setIsHover] = useState(false)
    return (
      <div
        className="flex h-20 w-full flex-row p-2 hover:bg-slate-400"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <img
          className="rounded-full"
          src="https://via.placeholder.com/150"
          alt="Placeholder"
        />
        <div className="mx-2 flex w-full flex-col justify-between py-1">
          <div className="flex flex-row justify-between">
            <p className="font-bold text-white">{name}</p>
            {isHover ? (
              <SquareIcon src={Assets.icons.more} />
            ) : (
              <p className=" text-white">{messLasted}</p>
            )}
          </div>
          <div>
            <p className="text-white">{lastText}</p>
          </div>
        </div>
      </div>
    )
  }
  const MessageItem = ({ message, isSender }) => {
    return (
      <div className={`my-10 flex ${!isSender && 'flex-row-reverse'}`}>
        <img
          className="size-8 rounded-full"
          src={user1.image}
          alt="Placeholder"
        />
        <div
          className={`rounded bg-slate-500 p-2 ${isSender ? 'ml-2' : 'mr-2'}`}
        >
          <p className="max-w-80 break-words">{message}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex size-full flex-row bg-slate-700">
      {/* danh sách hội thoại */}
      <div className="flex w-[34rem] flex-col">
        {/* header */}
        <div className="flex h-28 flex-col justify-between bg-slate-900 px-4 pt-4 mb-0.5">
          <div className="flex flex-row">
            <Search />
            <SquareIcon src={Assets.icons.addFriend} className={'mx-1'} />
            <SquareIcon src={Assets.icons.addGroup} />
          </div>
          <SelectedTab />
        </div>
        {/* content */}
        <div className="flex-grow bg-slate-900">
          {conversations.map((item) => (
            <ConversationItem
              name={item.name}
              lastText={item.lastText}
              messLasted={item.messLasted}
            />
          ))}
        </div>
      </div>

      {/* nội dung */}
      <div className="flex w-full flex-row bg-amber-200">
        {/* hội thoại */}
        <div className="flex w-full flex-col bg-slate-700">
          {/* header */}
          <div className="flex h-20 flex-row items-center bg-red-400 p-4">
            <div className="flex w-full flex-row">
              <img
                className="size-16 rounded-full"
                src={user1.image}
                alt="Placeholder"
              />
              <div className="mx-2 flex w-full flex-col justify-between py-1">
                <p className="text-lg font-bold text-cyan-50">{user1.name}</p>
                <p className="text-lg text-cyan-50">Truy cập 1 giờ trước</p>
              </div>
            </div>
            <SquareIcon src={Assets.icons.call} />
            <SquareIcon src={Assets.icons.videoCall} />
            <SquareIcon src={Assets.icons.addGroup} />
          </div>
          {/* nội dung hội thoại */}
          <div className="h-full overflow-auto scrollbar-hide bg-gray-900 p-8">
            {messages.map((item) => {
              return (
                <MessageItem
                  message={item.message}
                  isSender={item.userId === me.id}
                />
              )
            })}
          </div>
          {/* nhập tin nhắn */}
          <div
            className={`${isInputFocus ? 'bg-blue-600' : 'bg-slate-700'} mx-0.5 mt-0.5 flex flex-col gap-0.5`}
          >
            <div className="h-10 w-full bg-slate-800 px-2"></div>
            <div className="flex flex-row items-center justify-center bg-black px-4">
              <input
                className="h-16 w-full bg-black text-lg text-cyan-50 focus:outline-none"
                placeholder="Nhập @, tin nhắn..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onFocus={() => setIsInputFocus(true)}
                onBlur={() => setIsInputFocus(false)}
              />
              <img
                className="size-8"
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
        <div className="flex w-[34rem] flex-col bg-red-400">
          <div className="flex h-20 flex-col items-center justify-center bg-amber-200">
            <p className="text-lg font-bold text-cyan-50">
              Thông tin hội thoại
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

var conversations = [
  { id: 1, name: 'Nguyễn Văn A', lastText: 'Hello', messLasted: '1 phút' },
  { id: 1, name: 'Nguyễn Văn A', lastText: 'Hello', messLasted: '1 phút' },
  { id: 1, name: 'Nguyễn Văn A', lastText: 'Hello', messLasted: '1 phút' },
  { id: 1, name: 'Nguyễn Văn A', lastText: 'Hello', messLasted: '1 phút' },
  { id: 1, name: 'Nguyễn Văn A', lastText: 'Hello', messLasted: '1 phút' },
  { id: 1, name: 'Nguyễn Văn A', lastText: 'Hello', messLasted: '1 phút' },
]
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
var conversation = [
  {
    id: 1,
    userId: 1,
    message:
      'Hellojjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
    sentAt: '1 phút',
  },
  { id: 1, userId: 1, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 1, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 2, message: 'Hello', sentAt: '1 phút' },
  { id: 1, userId: 1, message: 'Hello', sentAt: '1 phút' },
]
