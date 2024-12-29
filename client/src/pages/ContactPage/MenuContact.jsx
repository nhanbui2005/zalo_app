import { useState } from 'react'

export const ItemMenuContact = ({ text, onClick, isActive }) => {
  return (
    <div className={`p-4 hover:bg-slate-500  ${isActive && 'bg-slate-700'}`} onClick={() => onClick()}>
      <p className="text-lg font-semibold text-white">{text}</p>
    </div>
  )
}

export const MenuContact = ({ menus }) => {
  const [currentItem, setCurrentItem] = useState(menus[0])
  return (
    <div>
      {menus.map((item) => (
        <ItemMenuContact
          isActive={currentItem == item}
          text={item}
          onClick={() => setCurrentItem(item)}
        />
      ))}
    </div>
  )
}
