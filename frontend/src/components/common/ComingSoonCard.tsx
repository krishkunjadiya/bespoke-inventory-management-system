import { Wrench } from '@phosphor-icons/react'
import type { ElementType } from 'react'

interface ComingSoonCardProps {
  title: string
  description: string
  icon?: ElementType
}

export default function ComingSoonCard({ title, description, icon: Icon = Wrench }: ComingSoonCardProps) {
  return (
    <div className="card p-8 text-center text-text-muted max-w-3xl">
      <div className="w-12 h-12 rounded-full bg-surface-muted text-text-secondary flex items-center justify-center mx-auto mb-3">
        <Icon size={22} />
      </div>
      <p className="font-heading font-semibold text-text-primary">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  )
}
