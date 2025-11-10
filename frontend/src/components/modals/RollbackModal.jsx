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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { promptsAPI, templatesAPI, chatsAPI } from '@/lib/api'

export default function RollbackModal({ open, onClose, promptId, itemType = 'prompt' }) {
  const [targetVersion, setTargetVersion] = useState('')
  const [strategy, setStrategy] = useState('revert_and_publish')
  const [rolling, setRolling] = useState(false)

  const handleRollback = async () => {
    try {
      setRolling(true)
      // Note: Current API doesn't support rollback endpoint
      const api = itemType === 'prompt' ? promptsAPI : itemType === 'template' ? templatesAPI : chatsAPI
      // TODO: Implement actual rollback endpoint in backend
      console.log('Rolling back:', { promptId, itemType, targetVersion, strategy })
      // Show success toast
      onClose()
    } catch (error) {
      console.error('Failed to rollback:', error)
    } finally {
      setRolling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>回滚 Prompt</DialogTitle>
          <DialogDescription>
            回滚到之前的版本
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target Version */}
          <div className="space-y-3">
            <Label>目标版本</Label>
            <Select value={targetVersion} onValueChange={setTargetVersion}>
              <SelectTrigger>
                <SelectValue placeholder="选择回滚目标版本" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1.0.0">v1.0.0 (prod) - 2h ago</SelectItem>
                <SelectItem value="v0.9.5">v0.9.5 (beta) - 1d ago</SelectItem>
                <SelectItem value="v0.9.0">v0.9.0 (prod) - 3d ago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Diff Summary */}
          {targetVersion && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-zinc-600 mb-2">
                  回滚将撤销 <strong>3 项变更</strong>：
                </p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>- 移除 label "v2"</li>
                  <li>- 恢复旧描述</li>
                  <li>- 删除 12 行内容</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Rollback Strategy */}
          <div className="space-y-3">
            <Label>回滚策略</Label>
            <RadioGroup value={strategy} onValueChange={setStrategy}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="revert_and_publish" id="strategy-1" />
                <Label htmlFor="strategy-1" className="font-normal cursor-pointer">
                  回滚并立即发布（推荐）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="revert_only" id="strategy-2" />
                <Label htmlFor="strategy-2" className="font-normal cursor-pointer">
                  仅回滚（Advanced - 需手动发布）
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Warning */}
          <Alert variant="warning">
            <AlertDescription>
              ⚠️ 此操作将覆盖当前草稿。Advanced 模式将创建 revert 提交。
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleRollback}
            disabled={!targetVersion || rolling}
          >
            {rolling ? '回滚中...' : '确认回滚'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
