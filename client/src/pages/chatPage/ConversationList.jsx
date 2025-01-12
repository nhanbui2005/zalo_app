import { useEffect, useState } from 'react'
import SquareIcon from '../../components/icon/squareIcon'
import { AddFriendModal } from '../../components/modal/AddFriendModal'
import roomAPI from '../../service/roomAPI'
import { Assets } from '../../assets'

export default function ConversationList({
  setCurrentConversation
}) {
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
        {items.map((item,index) => (
          <div key={index.toString()} className="" onClick={() => setIsSelected(item)}>
            <p
              className={`text-sm font-semibold hover:text-blue-500 ${isSelected === item ? 'text-blue-500' : 'text-slate-400'}`}
            >
              {item}
            </p>
            {isSelected === item && <div className="h-1 bg-blue-500" />}
          </div>
        ))}
      </div>
    )
  }
  const ConversationItem = ({
    id,
    data,
    lastText,
    messLasted,
    onClick
  }) => {
    const [isHover, setIsHover] = useState(false)
    return (
      <div
        className="flex h-20 w-full flex-row items-center p-2 hover:bg-dark-4"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onClick={onClick}
      >
        <img
          className="size-12 rounded-full"
          src={data.roomAvatarUrl}
          alt="Placeholder"
        />
        <div className="mx-2 flex w-full flex-col gap-1 py-1">
          <div className="flex flex-row justify-between">
            <p className="text-base text-white">{data.roomName}</p>
            {isHover ? (
              <SquareIcon className={'size-6'} src={Assets.icons.more} />
            ) : (
              <p className="text-sm text-slate-400">{messLasted}</p>
            )}
          </div>
          <p className="text-slate-400">{lastText}</p>
        </div>
      </div>
    )
  }

  const fetchConversations = async () => {
    const data = await roomAPI.getAllRoomAPI()
    setConversations(data.data)
    setCurrentRoom(data.data[0])
  }

  useEffect(() => {
    fetchConversations()
  }, [])
  

  return (
      <div className="flex w-[28rem] flex-col">
        {/* header */}
        <div className="mb-0.5 flex h-28 flex-col justify-between bg-dark-3 px-4 pt-4">
          <div className="flex flex-row">
            <Search />
            <SquareIcon
              onClick={() => setIsModelOpen(true)}
              src={Assets.icons.addFriend}
              className={'mx-1'}
            />
            <SquareIcon src={Assets.icons.addGroup} />
            <AddFriendModal isOpen={isModalOpen} setIsOpen={setIsModelOpen} />
          </div>
          <SelectedTab />
        </div>
        {/* content */}
        <div className="flex-grow bg-dark-3">
          {conversations.map((item, index) => (
            <ConversationItem
              key={index.toString()}
              data={item}
              lastText={'hello'}
              messLasted={'1h trước'}
              onClick={() => setCurrentConversation(item)}
            />
          ))}
        </div>
      </div>
  )
}