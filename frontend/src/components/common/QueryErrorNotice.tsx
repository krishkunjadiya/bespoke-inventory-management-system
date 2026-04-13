type QueryErrorNoticeProps = {
  title: string
  message: string
  onRetry?: () => void
}

export default function QueryErrorNotice({ title, message, onRetry }: QueryErrorNoticeProps) {
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-danger mb-1">{title}</p>
      <p className="text-sm text-text-secondary mb-3">{message}</p>
      <div className="flex flex-wrap gap-2">
        {onRetry && <button className="btn-primary btn-sm" onClick={onRetry}>Retry</button>}
        <button className="btn-secondary btn-sm" onClick={() => window.location.replace('/login')}>Re-login</button>
      </div>
    </div>
  )
}
