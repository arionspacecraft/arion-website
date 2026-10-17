import { useLanguage } from '../lib/language'
type Props<T extends string> = {
  options: T[]
  value: T | null
  onChange: (value: T | null) => void
}

export default function FilterTabs<T extends string>({ options, value, onChange }: Props<T>) {
  const { t } = useLanguage()
  return (
    <div className="tabs" role="group" aria-label={t("필터")}>
      <button type="button" className="tab" aria-pressed={value === null} onClick={() => onChange(null)}>{t("전체")} </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="tab"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {t(option)}
        </button>
      ))}
    </div>
  )
}
