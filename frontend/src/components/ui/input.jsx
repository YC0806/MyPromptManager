import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // 布局
        "flex h-10 w-full rounded-md px-3 py-2 text-sm",
        // 颜色 - 使用语义化类名，自动适配dark模式
        "border border-input bg-background text-foreground",
        "placeholder:text-muted-foreground",
        // 焦点状态
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "ring-offset-background",
        // 文件上传样式
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // 禁用状态
        "disabled:cursor-not-allowed disabled:opacity-50",
        // 过渡动画
        "transition-colors duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
