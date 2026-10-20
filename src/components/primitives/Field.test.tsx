import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CheckboxField, Field } from '@/components/primitives/Field'

// No vitest globals, so testing-library cannot register its own cleanup.
afterEach(cleanup)

describe('CheckboxField', () => {
  it('labels the box with its statement', () => {
    render(<CheckboxField name="consent" label="I agree to updates." />)
    const box = screen.getByRole('checkbox', { name: 'I agree to updates.' })
    expect(box.getAttribute('name')).toBe('consent')
    expect(box.getAttribute('aria-invalid')).toBeNull()
  })

  it('wires an error to the box and announces it', () => {
    render(<CheckboxField name="consent" label="I agree." error="Please tick this box." required />)
    const box = screen.getByRole('checkbox')
    expect(box.getAttribute('aria-invalid')).toBe('true')
    expect(box.getAttribute('aria-describedby')).toBe('consent-error')
    expect(screen.getByRole('alert').textContent).toBe('Please tick this box.')
    expect(box.hasAttribute('required')).toBe(true)
  })

  it('describes the box by its hint and its error, in that order', () => {
    render(<CheckboxField name="consent" label="I agree." hint="A hint." error="An error." />)
    expect(screen.getByRole('checkbox').getAttribute('aria-describedby')).toBe(
      'consent-hint consent-error',
    )
  })
})

describe('Field with a select', () => {
  it('draws the chevron beside the select and hides it', () => {
    const { container } = render(
      <Field name="industry" label="Industry" control="select" required>
        {(props) => (
          <select {...props}>
            <option value="">Choose</option>
          </select>
        )}
      </Field>,
    )
    const select = screen.getByRole('combobox', { name: 'Industry' })
    expect(select.className).toContain('appearance-none')
    const chevron = container.querySelector('svg')
    expect(chevron?.getAttribute('aria-hidden')).toBe('true')
    expect(chevron?.parentElement).toBe(select.parentElement)
  })

  it('marks an optional field, not a required one', () => {
    render(
      <Field name="organisation" label="Organisation">
        {(props) => <input {...props} />}
      </Field>,
    )
    expect(screen.getByLabelText('Organisation (optional)')).toBeTruthy()
  })
})
