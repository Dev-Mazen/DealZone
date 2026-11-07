import Badge from './Badge'
import Tag from './Tag'

export default function BadgeTagDemo() {
  const handleRemove = (label) => {
    console.log(`Removing tag: ${label}`)
  }

  return (
    <div className="p-8 space-y-12 bg-[#F4F7FB] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-[#06245B] mb-6">
          Badge & Tag Components Demo
        </h1>
      </div>

      {/* Badge Component */}
      <section className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-[#06245B]">Badge Component</h2>
        
        {/* Status Variants */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Status Colors
          </h3>
          <div className="flex flex-wrap gap-3">
            <Badge variant="success">Approved</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="error">Rejected</Badge>
            <Badge variant="info">In Transit</Badge>
            <Badge variant="navy">Active</Badge>
            <Badge variant="cyan">Featured</Badge>
            <Badge variant="gray">Draft</Badge>
          </div>
        </div>

        {/* Size Variants */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Size Variants
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success" size="sm">Small</Badge>
            <Badge variant="success" size="md">Medium</Badge>
            <Badge variant="success" size="lg">Large</Badge>
          </div>
        </div>

        {/* With Dots */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            With Status Dots
          </h3>
          <div className="flex flex-wrap gap-3">
            <Badge variant="success" dot size="sm">Online</Badge>
            <Badge variant="warning" dot size="md">Away</Badge>
            <Badge variant="error" dot size="lg">Offline</Badge>
            <Badge variant="info" dot>Processing</Badge>
          </div>
        </div>

        {/* Real-world Examples */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Real-world Examples
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">RFQ Status:</span>
              <Badge variant="success">Published</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Offer Status:</span>
              <Badge variant="warning">Under Review</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Deal Status:</span>
              <Badge variant="info">In Progress</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Verification:</span>
              <Badge variant="error">Rejected</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Notifications:</span>
              <Badge variant="error" size="sm">3</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Tag Component */}
      <section className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-[#06245B]">Tag Component</h2>
        
        {/* Status Variants */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Status Colors
          </h3>
          <div className="flex flex-wrap gap-3">
            <Tag variant="success">Verified</Tag>
            <Tag variant="warning">Pending</Tag>
            <Tag variant="error">Disputed</Tag>
            <Tag variant="info">New</Tag>
            <Tag variant="navy">Premium</Tag>
            <Tag variant="cyan">Featured</Tag>
            <Tag variant="gray">Archive</Tag>
          </div>
        </div>

        {/* Size Variants */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Size Variants
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Tag variant="info" size="sm">Small</Tag>
            <Tag variant="info" size="md">Medium</Tag>
            <Tag variant="info" size="lg">Large</Tag>
          </div>
        </div>

        {/* Removable Tags */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Removable Tags
          </h3>
          <div className="flex flex-wrap gap-3">
            <Tag variant="cyan" onRemove={() => handleRemove('Electronics')}>
              Electronics
            </Tag>
            <Tag variant="navy" onRemove={() => handleRemove('Raw Materials')}>
              Raw Materials
            </Tag>
            <Tag variant="info" onRemove={() => handleRemove('Chemicals')}>
              Chemicals
            </Tag>
            <Tag variant="gray" onRemove={() => handleRemove('Textiles')}>
              Textiles
            </Tag>
          </div>
        </div>

        {/* With Icons */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            With Icons
          </h3>
          <div className="flex flex-wrap gap-3">
            <Tag 
              variant="success" 
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              }
            >
              Verified Supplier
            </Tag>
            <Tag 
              variant="warning" 
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 4zM8 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
              }
            >
              Pending Review
            </Tag>
            <Tag 
              variant="navy" 
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>
              }
            >
              Premium Member
            </Tag>
          </div>
        </div>

        {/* Real-world Examples */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Real-world Examples (Category Filters)
          </h3>
          <div className="flex flex-wrap gap-2">
            <Tag variant="navy" size="sm" onRemove={() => handleRemove('Steel')}>
              Steel
            </Tag>
            <Tag variant="navy" size="sm" onRemove={() => handleRemove('Aluminum')}>
              Aluminum
            </Tag>
            <Tag variant="navy" size="sm" onRemove={() => handleRemove('Copper')}>
              Copper
            </Tag>
            <Tag variant="navy" size="sm" onRemove={() => handleRemove('Plastics')}>
              Plastics
            </Tag>
            <Tag variant="navy" size="sm" onRemove={() => handleRemove('Chemicals')}>
              Chemicals
            </Tag>
            <Tag variant="cyan" size="sm">
              + Add Filter
            </Tag>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-[#06245B]">Badge vs Tag</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-[#06245B]">When to use Badge</h3>
            <ul className="text-sm text-[#64748B] space-y-2 list-disc list-inside">
              <li>Status indicators (approved, pending, rejected)</li>
              <li>Notification counts</li>
              <li>Compact labels with transparent backgrounds</li>
              <li>Read-only information display</li>
              <li>Status dots for presence indicators</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="success">Approved</Badge>
              <Badge variant="error" dot>Offline</Badge>
              <Badge variant="warning" size="sm">3</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-[#06245B]">When to use Tag</h3>
            <ul className="text-sm text-[#64748B] space-y-2 list-disc list-inside">
              <li>Category labels and filters</li>
              <li>Removable/interactive elements</li>
              <li>Solid color backgrounds for emphasis</li>
              <li>Collection of related items</li>
              <li>Tags with icons or actions</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Tag variant="navy" onRemove={() => {}}>Category</Tag>
              <Tag variant="cyan">Featured</Tag>
              <Tag variant="info" size="sm">Filter</Tag>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
