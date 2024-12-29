import { useEffect, useRef, useState } from 'react'
import { Assets } from '../assets'
import TaskBarMenuButton from '../components/button/taskBarMenuButton'
import { useDispatch, useSelector } from 'react-redux'
import LogoutModal from '../components/modal/LogoutModal'
import { logout } from '../redux/slices/userSlice'
import ChatPage from '../pages/ChatPage'
import ContactPage from '../pages/ContactPage/ContactPage'

export default function HomeLayout({ children }) {
  const menu = [
    {
      id: 'chat',
      iconActive: Assets.icons.chatActive,
      iconInActive: Assets.icons.chatInActive,
    },
    {
      id: 'contact',
      iconActive: Assets.icons.contact,
      iconInActive: Assets.icons.contactOutline,
    },
  ]
  const avatarUrl = useSelector((state) => state.me.user.avatarUrl)
  const user = useSelector((state) => state.me.auth)

  const [activeItem, setActiveItem] = useState(menu[0])
  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const settingRef = useRef(null)
  const dispatch = useDispatch()

  const toggleMenu = (event) => {
    event.stopPropagation() // Ngăn sự kiện click lan lên document
    setIsSettingOpen(!isSettingOpen)
  }

  const onLogout = async () =>{
    try {
      dispatch(logout())
    } catch (error) {
      
    }
  }

  const getChild = () => {
    if (activeItem.id == 'chat') {
      return <ChatPage/>
    }else if (activeItem.id == 'contact') {
      return <ContactPage/>
    }
  }

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingRef.current && !settingRef.current.contains(event.target)) {
        setIsSettingOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="flex h-screen w-screen flex-row">
      {/* thanh taskbar */}
      {/* {user.accessToken} */}
      <div className="flex w-16 flex-col bg-dark-1 px-2 py-3">
        <img className="rounded-full" src={avatarUrl} alt="Placeholder" />

        {/* menu */}
        <div className="mt-8 h-full">
          {menu.map((item) => (
            <TaskBarMenuButton
              onClick={() => setActiveItem(item)}
              isActive={item.id === activeItem.id}
              imgActive={item.iconActive}
              imgInActive={item.iconInActive}
              className="mb-4 h-12 w-12"
            />
          ))}
        </div>

        {/* menu setting */}
        <div>
          <TaskBarMenuButton
            onClick={(e) => toggleMenu(e)}
            imgActive={Assets.icons.setting}
            imgInActive={Assets.icons.settingOutLine}
            className="mb-4"
          />
        </div>
      </div>

      {/* nội dung */}
      <div className="w-full bg-dark-2">
        {getChild()}
      </div>
      {isSettingOpen && (
        <div
          ref={settingRef}
          className="fixed bottom-20 left-6 w-56 rounded-lg bg-gray-800 text-white shadow-lg"
        >
          <ul className="space-y-1 p-2">
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              🔒 Thông tin tài khoản
            </li>
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              ⚙️ Cài đặt
            </li>
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              💾 Dữ liệu
            </li>
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              🔧 Công cụ
            </li>
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              🌐 Ngôn ngữ
            </li>
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              ℹ️ Giới thiệu
            </li>
            <hr className="border-gray-600" />
            <li
              onClick={() => setIsLogoutModalOpen(true)}
              className="cursor-pointer rounded p-2 font-bold text-red-400 hover:bg-gray-700"
            >
              🔴 Đăng xuất
            </li>
            <li className="cursor-pointer rounded p-2 hover:bg-gray-700">
              ❌ Thoát
            </li>
          </ul>
        </div>
      )}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onRequestClose={() => setIsLogoutModalOpen(false)}
        onLogout={onLogout}
      />
    </div>
  )
}
