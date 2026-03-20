const AM_STEPS = ['潔顏', '化妝水', '防曬']
const PM_STEPS = ['卸妝', '潔顏', '精華', '乳霜']

function CheckItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text-primary py-0.5">
      <span className="w-3.5 h-3.5 border border-border rounded-xs inline-flex items-center justify-center flex-shrink-0" />
      {label}
    </li>
  )
}

export default function SkincareCard() {
  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Skincare SOP
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-mono text-text-muted mb-2">AM</p>
          <ul className="space-y-1">
            {AM_STEPS.map((step) => (
              <CheckItem key={step} label={step} />
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-mono text-text-muted mb-2">PM</p>
          <ul className="space-y-1">
            {PM_STEPS.map((step) => (
              <CheckItem key={step} label={step} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
