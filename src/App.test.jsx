import { render, screen } from '@testing-library/react'
import App from './App'
import { describe, test, expect } from 'vitest'

test('renders app', () => {
    render(<App />)
    // Look for "Sign In" which is present on the Login page (button or text)
    expect(screen.getAllByText(/Sign In/i)[0]).toBeInTheDocument()
})
