import { useState } from "react"
import MessageModal from "./MessageModal";
import userAPI from "../../service/userAPI";

export const AddFriendModalSearchContent = ({
  onCancel,
  onSearch
}) => {
  const [email, setEmail] = useState('')
  const [isMessageToast, setIsMessageToast] = useState('')

  const handleSearch = async () => {
    try {
      const data = await userAPI.findUserByEmail(email)
      onSearch(data)
    } catch (error) {
      if (error.statusCode == 404) {
        setIsMessageToast(true)
        setTimeout(() => {
          setIsMessageToast(false)
        }, 3000);
      }
    }
  }
  return (
    <>
      {/* Modal Body */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="text-black mb-4 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Kết quả gần nhất
        </h3>
        {/* Friend Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Nhân (+84) 0389 857 738</span>
            <button className="rounded-md border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-600 hover:text-white">
              Kết bạn
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span>Khánh Linh (+84) 0327 056 892</span>
            <button className="rounded-md border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-600 hover:text-white">
              Kết bạn
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span>Hà Đăng Mobile (+84) 0903 930 000</span>
            <button className="rounded-md border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-600 hover:text-white">
              Kết bạn
            </button>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="rounded-md  px-4 py-2 bg-dark-3 hover:bg-dark-4"
        >
          Hủy
        </button>
        <button onClick={handleSearch} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">
          Tìm kiếm
        </button>
        <MessageModal isOpen={isMessageToast} message={'Email này chưa đăng ký tài khoản hoặc không cho tìm kiếm'}/>
      </div>
    </>
  )
}
