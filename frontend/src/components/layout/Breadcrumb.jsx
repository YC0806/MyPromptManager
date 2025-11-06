import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function Breadcrumb({ items = [], status = null }) {
  return (
    <div className="flex items-center justify-between h-12 px-8 bg-white/50 border-b">
      {/* Left - Breadcrumb Trail */}
      <nav className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-zinc-600 hover:text-teal-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                index === items.length - 1
                  ? 'text-zinc-900 font-medium'
                  : 'text-zinc-600'
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
              <span className="text-xs text-zinc-500">Latest Release:</span>
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
              <span className="text-xs text-zinc-500">Draft Status:</span>
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
