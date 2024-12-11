import { useState } from "react";
import { Assets } from "../assets";
import TaskBarMenuButton from "../components/button/taskBarMenuButton";

export default function HomeLayout({children}) {
  const menu = [
    {
      id:'chat',
      iconActive:Assets.icons.chatActive,
      iconInActive:Assets.icons.chatInActive
    },
    {
      id:'contact',
      iconActive:Assets.icons.contact,
      iconInActive:Assets.icons.contactOutline
    },
  ]

  const [activeItem, setActiveItem] = useState(menu[0])

  return (
    <div className="w-screen h-scree flex flex-row">
      {/* thanh taskbar */}
      <div className="h-screen w-[5rem]	bg-black px-2">
        <text>ddd</text>
        <img
          className="rounded-full"
          src="https://via.placeholder.com/150"
          alt="Placeholder"
        />

        {/* menu */}
        <div className="mt-8">
          {
            menu.map(item => (
              <TaskBarMenuButton
                onClick={()=>setActiveItem(item)}
                isActive={item.id === activeItem.id}
                imgActive={item.iconActive}
                imgInActive={item.iconInActive}
                className="mb-4"
              />
            ))
          }
        </div>
      </div>

      {/* nội dung */}
      <div className="h-screen w-full	bg-emerald-400">
        {children}
      </div>
    </div>
  );
}
