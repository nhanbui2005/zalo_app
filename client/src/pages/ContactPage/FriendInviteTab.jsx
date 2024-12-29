import { useEffect, useState } from "react"
import { InviteFriendCard } from "../../components/card/InviteFriendCard"
import relationAPI from "../../service/relationAPI"

export const FriendInviteTab = () => {
  const [data, setData] = useState([])

  const fetchData = async () => {
    const data = await relationAPI.getAllRelationsRequestAPI()
    console.log(data);
    setData(data)
  }
  useEffect(() => {
    fetchData()
  }, [])
  
  return (
    <div className="p-4 flex flex-col">
      <p className="text-white">{`Lời mời đã nhận ( ${data.length} )`}</p>
      <div className="flex flex-row gap-4 mt-4">
        {
          (data && data.length > 0) &&
          data.map(item => {          
            return(
              <InviteFriendCard data={item}/>
            )
          })
        }
      </div>
      <p className="text-white">{`Lời mời đã gửi ( ${data.length} )`}</p>
      
    </div>
  )
}