import { useEffect, useState } from 'react'
import SquareIcon from '../../components/icon/squareIcon'
import { Assets } from '../../assets'
import { useDispatch, useSelector } from 'react-redux'
import Utils from '../../utils/utils'
import GroupAvatar from '../../components/GroupAvatar'
import { addNewMsg } from '../../redux/slices/currentRoomSlice'
import {
  getAllRooms,
  updateLastMsgForRoom,
  updateLastMsgForRoomWhenSentMsg,
} from '../../redux/slices/roomSlice'
import { SearchComponent } from '../../components/SearchComponent'
import { Link } from 'react-router-dom'
import { onEvent } from '../../socket/socket'

export default function ConversationList() {
  const dispatch = useDispatch()
  const rooms = useSelector((state) => state.rooms.data)
  const meId = useSelector((state) => state.user.id)
  const roomId = useSelector((state) => state.currentRoom.roomId)
  const items = ['Tất cả', 'Chưa đọc']
  const [isSelected, setIsSelected] = useState(items[0])
  const [sortedRooms, setSortedRooms] = useState([])

  onEvent('notifications','new_message', (data) => {
    console.log('tin nhắn mới', data)
    if (data.sender.userId !== meId && roomId == data.roomId) {      
      dispatch(addNewMsg(data))
    }
    if (data.sender.userId == meId && roomId == data.roomId) {      
      
    }
    if (!roomId || roomId != data.roomId) {                  
      dispatch(updateLastMsgForRoom({roomId:data.roomId,lastMsg:data}))
    }
    dispatch(updateLastMsgForRoomWhenSentMsg({roomId:data.roomId, lastMsg: data}))
  })

  useEffect(() => {    
    dispatch(getAllRooms())
  }, [])

  useEffect(() => {
    let rooms2 = rooms.map((room) => ({ ...room }))
    rooms2.sort((a, b) => {
      return new Date(b.lastMsg.createdAt) - new Date(a.lastMsg.createdAt)
    })
    setSortedRooms(rooms2)
  }, [rooms])
  
  return (
    <div className="flex w-[22rem] flex-col">
      {/* header */}
      <SearchComponent />
      <div className="flexflex-col px-4">
        <div className="flex gap-3">
          {items.map((item, index) => (
            <div
              key={index.toString()}
              className=""
              onClick={() => setIsSelected(item)}
            >
              <p
                className={`text-sm font-semibold hover:text-blue-500 ${isSelected === item ? 'text-blue-500' : 'text-slate-400'}`}
              >
                {item}
              </p>
              {isSelected === item && <div className="h-1 bg-blue-500" />}
            </div>
          ))}
        </div>
      </div>
      <div className="my-1 h-0.5 w-full bg-slate-400" />
      {/* content */}
      <div className="w-[22rem] flex-grow bg-slate-50">
        {sortedRooms.map((item, index) => (
          <ConversationItem
            key={index.toString()}
            isFocus={item?.id == roomId}
            data={item}
            lastMsg={item?.lastMsg}
            messLasted={item?.lastMsg?.createdAt}
            msgReceived={item.receivedMsgs}
            isSelfSent={item?.lastMsg?.isSelfSent}
            // onClick={() => onItemClick(item)}
            unReadMsgCount={item?.unReadMsgCount}
          />
        ))}
      </div>
    </div>
  )
}
const Search = () => {
  const [isFocus, setIsFocus] = useState(false)

  return (
    <div
      className={`${
        isFocus && 'outline outline-1 outline-sky-400'
      } flex w-full flex-row rounded-lg bg-slate-200 px-1`}
    >
      <SquareIcon src={Assets.icons.search} />
      <input
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        className="search-input w-full bg-slate-200 focus:outline-none"
        placeholder="Tìm kiếm"
      />
    </div>
  )
}
const SelectedTab = () => {
  const items = ['Tất cả', 'Chưa đọc']
  const [isSelected, setIsSelected] = useState(items[0])
  return (
    <div className="flexflex-col">
      <div className="flex gap-3">
        {items.map((item, index) => (
          <div
            key={index.toString()}
            className=""
            onClick={() => setIsSelected(item)}
          >
            <p
              className={`text-sm font-semibold hover:text-blue-500 ${isSelected === item ? 'text-blue-500' : 'text-slate-400'}`}
            >
              {item}
            </p>
            {isSelected === item && <div className="h-1 bg-blue-500" />}
          </div>
        ))}
      </div>
    </div>
  )
}
const ConversationItem = ({
  data,
  isFocus,
  isSelfSent,
  lastMsg,
  messLasted,
  msgReceived,
  onClick,
  unReadMsgCount,
}) => {
  const [isHover, setIsHover] = useState(false)
  const [timeDifference, setTimeDifference] = useState('')

  useEffect(() => {
    // Cập nhật ngay lập tức
    setTimeDifference(Utils.getTimeDifferenceFromNow(messLasted))

    // Thiết lập cập nhật mỗi phút
    const intervalId = setInterval(() => {
      setTimeDifference(Utils.getTimeDifferenceFromNow(messLasted))
    }, 60 * 1000)

    // Dọn dẹp interval khi component bị unmount
    return () => clearInterval(intervalId)
  }, [messLasted])

  return (
    <Link
      to={`/messages/${data.id}?type=room`}
      className={`flex h-20 w-full flex-row items-center p-2 pr-4 hover:bg-slate-200 ${isFocus && 'bg-blue-200'}`}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      // onClick={onClick}
    >
      {data.roomAvatar ? (
        <img
          className="size-12 rounded-full"
          src={data.roomAvatar}
          alt="Placeholder"
        />
      ) : (
        <div className="relative z-0">
          <GroupAvatar roomAvatars={data.roomAvatars} />
        </div>
      )}

      <div className="w-full">
        <div className="mx-2 flex w-full flex-row gap-1 py-1">
          <p className="w-full overflow-hidden whitespace-nowrap text-base">
            {data.roomName}
          </p>
          {isHover ? (
            <div className="w-16">
              <SquareIcon className={'size-6'} src={Assets.icons.more} />
            </div>
          ) : (
            <p className="w-28 text-right text-xs font-semibold text-slate-500">
              {timeDifference}
            </p>
          )}
        </div>
        <div className="mx-2 flex w-full flex-row gap-1 py-1">
          <span className="max-w-60 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-400">
            {(isSelfSent ? 'Bạn: ' : '') +
              (lastMsg?.type == 'text' ? lastMsg?.content : 'Hình ảnh')}
          </span>
          {(unReadMsgCount || unReadMsgCount > 0) && (
            <p className="size-5 rounded-full bg-red-600 text-center text-sm text-white">
              {unReadMsgCount}
            </p>
          )}
          {/* {msgReceived &&
            Array.isArray(msgReceived) &&
            msgReceived.length > 0 && (
              <>
                <p className="size-5 rounded-full bg-red-600 text-center text-sm text-white">
                  {unReadMsgCount}
                </p>
              </>
            )} */}
        </div>
      </div>
    </Link>
  )
}
