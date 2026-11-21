import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldProps = { label: string; error?: string; hint?: string; id: string }
export function InputField({ label, error, hint, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const description = error || hint
  return <div className="public-form-field"><label htmlFor={id}>{label}</label><input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={description ? id + '-hint' : undefined} suppressHydrationWarning />{description && <p id={id + '-hint'} className={error ? 'public-field-error' : 'public-field-hint'}>{description}</p>}</div>
}
export function TextareaField({ label, error, hint, id, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <div className="public-form-field"><label htmlFor={id}>{label}</label><textarea {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error || hint ? id + '-hint' : undefined} suppressHydrationWarning />{(error || hint) && <p id={id + '-hint'} className={error ? 'public-field-error' : 'public-field-hint'}>{error || hint}</p>}</div>
}
export function issueFields(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  return Object.fromEntries(issues.map(issue => [String(issue.path[0]), issue.message]))
}
