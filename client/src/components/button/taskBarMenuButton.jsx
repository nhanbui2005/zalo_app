export default function TaskBarMenuButton({
  onClick,
  className,
  imgActive,
  imgInActive,
  isActive
}) {
  return (
    <div className={`${className} hover:bg-slate-500 p-2 rounded-md ${isActive && "bg-slate-500"}`} onClick={(e)=>onClick(e)}>
      <img
          className="size-8 align-middle"
          src={isActive ?  imgActive : imgInActive}
          alt="Placeholder"
        />
    </div>
  )
}