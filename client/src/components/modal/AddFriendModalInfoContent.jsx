import { useState } from "react"
import relationAPI from "../../service/relationAPI"
import { ActionHandleAddFriend } from "../../constants/appConstant"
import { useSelector } from 'react-redux'
import { toast } from "sonner"

const RelationStatus = {
  NOTTHING: 'notthing',
  PENDING: 'pending',
  ACCEPTED: 'accepted'
}

const WhoSent = {
  ME: 'me',
  PARTNER: 'partner',
}

export const AddFriendModalInfoContent = ({
  data
}) => {
  const {user} = data
  const [status, setStatus] = useState(data.status) 
  const [inviter, setInviter] = useState(data.inviter)
  const [relationId, setRelationId] = useState(data.id)
  const me = useSelector((state) => state.user)

  const getStatusName = ({status, inviter}) => {    
    if (status == RelationStatus.NOTTHING) {
      return 'Kết bạn'
    }else if (status == RelationStatus.PENDING) {
      return inviter == 'self' ? 'Hủy kết bạn' : 'Đồng ý'
    }else{
      return 'Gọi điện'
    }
  }

  const sendRequestAddFriend = async () => {    
    try {
      console.log('aaaaaaaaaaa');
      
      const data = await relationAPI.sendRequestAddFriendAPI({
        receiverId: user.id
      })
      console.log('dsataa', data);
      
      setRelationId(data.id)
      setInviter('self')
      setStatus(data.status)
      toast.success("Gửi yêu cầu kết bạn thành công!", {
        position: "top-center",
        duration: 2000,
      });
    } catch (error) {
      
    }
  }

  const handleRequestAddFriend = async (relationId) => {
    try {
      await relationAPI.handleRequestAddFriendAPI({relationId, action: inviter === 'self' ? ActionHandleAddFriend.REVOKE : ActionHandleAddFriend.ACCEPT})
      setStatus(inviter == 'self' ? RelationStatus.NOTTHING : RelationStatus.ACCEPTED)
    } catch (error) {
      
    }
  }

  const isMe = () => {    
    return me.id == user.id
  }

    
  return (
    <>
      {/* Profile Image */}
      <div className="mt-4 flex justify-center">
        <img
          src={user.avatarUrl}
          alt="Avatar"
          className="h-32 w-32 rounded-full object-cover"
        />
      </div>

      {/* User Name */}
      <div className="mt-4 text-center">
        <h3 className="text-xl font-semibold">{user.username}</h3>
        {
          !isMe() && 
          <div className="mt-2 flex justify-center space-x-2">
            <button onClick={async () => {            
              if (status == RelationStatus.NOTTHING) {
                //có thể gửi y/c kết bạn
                await sendRequestAddFriend()
              }else if(status == RelationStatus.PENDING){
                await handleRequestAddFriend(relationId)
              }else{//accepted
                //có thể gọi điện
              }
            }} className="rounded-md bg-gray-400 px-4 py-2 hover:bg-gray-500 font-medium">
              {getStatusName({status, inviter})}
            </button>
            <button 
              onClick={()=> {}}
              className="rounded-md bg-blue-600 px-4 py-2 hover:bg-blue-700 text-white font-medium"
            >
              Nhắn tin
            </button>
          </div>
        }
      </div>

      {/* User Information */}
      <div className="space-y-2 p-4">
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Giới tính</span>
          <span>{user.gender == 'male' ? 'Nam' : 'Nữ'}</span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Ngày sinh</span>
          <span>{user.dob}</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-gray-400">Email</span>
          <span>{user.email}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-b-lg bg-gray-700 p-4 text-center">
        <p className="text-gray-400">Chưa có ảnh nào được chia sẻ</p>
      </div>
    </>
  )
}
