type Props<T extends string> = {
  options: T[]
  value: T | null
  onChange: (value: T | null) => void
}

export default function FilterTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="tabs" role="group" aria-label="필터">
      <button type="button" className="tab" aria-pressed={value === null} onClick={() => onChange(null)}>
        전체
      </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="tab"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
