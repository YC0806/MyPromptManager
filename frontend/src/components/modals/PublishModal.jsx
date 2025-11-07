import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { simpleApi } from '@/lib/api'

export default function PublishModal({ open, onClose, promptId, itemType = 'prompt' }) {
  const [channel, setChannel] = useState('prod')
  const [versionType, setVersionType] = useState('auto')
  const [notes, setNotes] = useState('')
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    try {
      setPublishing(true)
      await simpleApi.publish(promptId, itemType, {
        channel,
        version: versionType,
        notes,
      })
      // Show success toast
      onClose()
    } catch (error) {
      console.error('Failed to publish:', error)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>发布 Prompt</DialogTitle>
          <DialogDescription>
            发布新版本到指定渠道
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Channel Selection */}
          <div className="space-y-3">
            <Label>渠道</Label>
            <RadioGroup value={channel} onValueChange={setChannel}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prod" id="channel-prod" />
                <Label htmlFor="channel-prod" className="font-normal cursor-pointer">
                  Production
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="beta" id="channel-beta" />
                <Label htmlFor="channel-beta" className="font-normal cursor-pointer">
                  Beta
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Version Selection */}
          <div className="space-y-3">
            <Label>版本号</Label>
            <Select value={versionType} onValueChange={setVersionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动 (建议 v1.0.1 - PATCH)</SelectItem>
                <SelectItem value="minor">Minor (v1.1.0)</SelectItem>
                <SelectItem value="major">Major (v2.0.0)</SelectItem>
                <SelectItem value="custom">自定义...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Release Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">发布备注</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="描述此次更新的内容..."
              rows={4}
            />
          </div>

          {/* Change Summary */}
          <Card className="bg-teal-50 border-teal-200">
            <CardHeader>
              <CardTitle className="text-sm">变更摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">+12 行插入</span>
                <span className="text-red-600">-5 行删除</span>
                <span className="text-blue-600">3 项 Front Matter 变更</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            className="bg-teal-500 hover:bg-teal-600"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? '发布中...' : '发布并复制链接 →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
