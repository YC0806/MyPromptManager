import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function Breadcrumb({ items = [], status = null }) {
  return (
    <div className={cn(
      // 布局
      "flex items-center justify-between h-12 px-8",
      // 颜色 - 使用语义化类名，自动适配dark模式
      "bg-card/50 border-b border-border"
    )}>
      {/* Left - Breadcrumb Trail */}
      <nav className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                index === items.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right - Status Summary */}
      {status && (
        <div className="flex items-center gap-4">
          {status.latestRelease && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Latest Release:</span>
              <Badge variant="success" className="font-mono">
                {status.latestRelease.version}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {status.latestRelease.channel}
              </Badge>
            </div>
          )}
          {status.draft && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Draft Status:</span>
              <Badge variant="warning">
                {status.draft.message}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
