import { useEffect, useState } from "react"
import relationAPI from "../../service/relationAPI"
import messageAPI from "../../service/messageAPI"
import ConversationContent from "../chatPage/ConversationContent"
import ConversationInfo from "../chatPage/ConversationInfo"

const FriendListTab = () => {
  const [friendList, setFriendList] = useState([])
  const [curConver, setCurConver] = useState(null)
  const [partner, setPartner] = useState(null)
  
  const fetchFriendList = async () => {
    const data = await relationAPI.getAllRelationsRequestAPI('friend')    
    setFriendList(data)
  }
  
  useEffect(() => {
    fetchFriendList()
  }, [])

  const onItemClick = async (partner) => {
    const conversation = await messageAPI.loadMoreMessage('')
    setPartner(partner)
    setCurConver(conversation)
  }
  
  return(
    <div className="w-full h-full gap-1">
      {
        (curConver || partner) ?
        <div className="flex w-full h-full flex-row">
          {/* hội thoại */}
          <ConversationContent
            avatarUrl={partner.avatarUrl}
            name={partner?.username}
            partnerId={partner?.id}
          />
          {/* thông tin hội thoại*/}
          <ConversationInfo/>
        </div>
        :
        friendList.map(item => 
          <div
            onClick={()=>onItemClick(item.user)}
            className="h-24 px-4 flex flex-col items-center justify-center hover:bg-dark-4">
            <div className="w-full h-full mb-1 flex flex-row items-center gap-4">
              <img className="rounded-full size-14" src={item.user.avatarUrl}/>
              <p className="text-white font-bold size-10 w-full">{item.user.username}</p>
            </div>
            <div className="h-[1px] w-full bg-dark-5"/>
          </div>
        )
      }
    </div>
  )
}

export default FriendListTab