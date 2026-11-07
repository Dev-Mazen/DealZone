import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterPanel from './FilterPanel'

const sampleFilters = [
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    defaultExpanded: true,
    options: [
      { value: 'Published', label: 'Published', count: 42 },
      { value: 'Draft', label: 'Draft', count: 8 },
      { value: 'Closed', label: 'Closed', count: 15 },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'radio',
    defaultExpanded: false,
    options: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget (EGP)',
    type: 'range',
    min: 0,
    max: 500000,
    unit: 'EGP',
    defaultExpanded: false,
  },
]

describe('FilterPanel Component', () => {
  describe('Rendering', () => {
    it('renders the panel title', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('renders a custom title', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
          title="Refine Results"
        />
      )
      expect(screen.getByText('Refine Results')).toBeInTheDocument()
    })

    it('renders all filter section labels', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Budget (EGP)')).toBeInTheDocument()
    })

    it('shows options for expanded sections', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      // Status is defaultExpanded: true
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('renders loading skeleton when isLoading is true', () => {
      const { container } = render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
          isLoading={true}
        />
      )
      // Should show pulse skeleton elements
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('Apply and Clear buttons', () => {
    it('renders Apply button with default label', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      expect(screen.getByText('Apply Filters')).toBeInTheDocument()
    })

    it('renders Apply with custom label', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
          applyLabel="Search Now"
        />
      )
      expect(screen.getByText('Search Now')).toBeInTheDocument()
    })

    it('calls onApply when Apply button is clicked', async () => {
      const onApply = vi.fn()
      const user = userEvent.setup()
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={onApply}
          onClear={vi.fn()}
        />
      )
      await user.click(screen.getByText('Apply Filters'))
      expect(onApply).toHaveBeenCalledTimes(1)
    })

    it('calls onClear when Clear All button is clicked', async () => {
      const onClear = vi.fn()
      const user = userEvent.setup()
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{ status: ['Published'] }} // has active filter so Clear is enabled
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={onClear}
        />
      )
      await user.click(screen.getByText('Clear All'))
      expect(onClear).toHaveBeenCalledTimes(1)
    })
  })

  describe('Active filter chips', () => {
    it('shows chips for active checkbox values', () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{ status: ['Published', 'Draft'] }}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('calls onChange when chip X is clicked to remove', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{ status: ['Published'] }}
          onChange={onChange}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      // Find remove button for Published chip
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])
      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('Collapsible sections', () => {
    it('toggles section open/closed on header click', async () => {
      const user = userEvent.setup()
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={vi.fn()}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      // Priority starts collapsed (defaultExpanded: false)
      // Click header to expand
      const priorityHeader = screen.getByRole('button', { name: /priority/i })
      await user.click(priorityHeader)
      expect(screen.getByText('High')).toBeInTheDocument()
    })
  })

  describe('onChange callback', () => {
    it('calls onChange with updated checkbox values', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <FilterPanel
          filters={sampleFilters}
          values={{}}
          onChange={onChange}
          onApply={vi.fn()}
          onClear={vi.fn()}
        />
      )
      // Status is expanded, click Published checkbox
      const checkbox = screen.getByRole('checkbox', { name: /published/i })
      await user.click(checkbox)
      expect(onChange).toHaveBeenCalledWith('status', expect.arrayContaining(['Published']))
    })
  })
})

