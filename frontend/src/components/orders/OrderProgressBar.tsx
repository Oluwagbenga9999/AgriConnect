import { Order } from '@/types'

const STAGES: { key: Order['status']; label: string }[] = [
  { key: 'confirmed', label: 'Paid' },
  { key: 'seen',      label: 'Seen' },
  { key: 'packaged',  label: 'Packaged' },
  { key: 'shipped',   label: 'Sent' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'received',  label: 'Received' },
]

const STAGE_INDEX: Record<string, number> = Object.fromEntries(STAGES.map((s, i) => [s.key, i]))

interface OrderProgressBarProps {
  status: Order['status']
}

export default function OrderProgressBar({ status }: OrderProgressBarProps) {
  if (status === 'pending' || status === 'failed') {
    return (
      <div className={`text-xs font-medium px-3 py-2 rounded-lg ${
        status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
      }`}>
        {status === 'failed' ? 'Payment failed' : 'Awaiting payment'}
      </div>
    )
  }

  if (status === 'received') {
    return (
      <div className="mt-3">
        <div className="flex items-center w-full">
          {STAGES.map((stage, i) => {
            const isLast = i === STAGES.length - 1
            return (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-green-600 text-white">
                    ✓
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap text-green-700">
                    {stage.label}
                  </span>
                </div>
                {!isLast && <div className="h-0.5 flex-1 mx-1 mb-4 bg-green-600" />}
              </div>
            )
          })}
        </div>
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Certified complete
        </div>
      </div>
    )
  }

  const currentIndex = STAGE_INDEX[status] ?? 0

  return (
    <div className="flex items-center w-full mt-3">
      {STAGES.map((stage, i) => {
        const done = i <= currentIndex
        const isLast = i === STAGES.length - 1
        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                done ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {done ? '✓' : ''}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${done ? 'text-green-700' : 'text-gray-400'}`}>
                {stage.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < currentIndex ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}