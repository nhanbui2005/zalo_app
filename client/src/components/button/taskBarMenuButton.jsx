export default function TaskBarMenuButton({
  onClick,
  className,
  imgActive,
  imgInActive,
  isActive
}) {
  return (
    <div className={`${className} `} style={{}} onClick={()=>onClick()}>
      <div className={`hover:bg-slate-500 p-1 rounded-md ${isActive && "bg-slate-500"}`}>
        <img
            className="size-12 p-1"
            src={isActive ?  imgActive : imgInActive}
            alt="Placeholder"
          />
      </div>
    </div>
  )
}