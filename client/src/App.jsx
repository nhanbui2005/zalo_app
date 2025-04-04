import { useDispatch, useSelector } from 'react-redux'
import useSocketEvent from './hooks/useSocket'
import { AppRoutes } from './Routes/routes'
import { loadMoreMsgWhenConnect } from './redux/slices/roomSlice'

export default function App() {
  const dispatch = useDispatch()
  const meId = useSelector((state) => state.user.id)

  useSocketEvent('load_more_msgs_when_connect', (data) => {
    console.log('after connect', data)
    dispatch(loadMoreMsgWhenConnect(data))
  })

  // useSocketEvent('new_message', (data) => {
  //   console.log('tin nhắn mới', data)
  //   if (data.sender.userId !== meId) {
  //     dispatch(addNewMgs(data))
  //   }
  //   if (currentRoomId !=data.roomId) {      
  //     dispatch(updateLastMsgForRoom({roomId:data.roomId,lastMsg:data}))
  //   }
  // })
  
  return (
    <AppRoutes/>
   
  )
}
