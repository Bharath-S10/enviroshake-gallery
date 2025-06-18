import React from 'react'

const filters = {
  color: ['Autumn', 'Canyon', 'Slate Black', 'Mountain'],
  roofStyle: ['Gable', 'Hip', 'Gambrel', 'Mansard'],
  roofDetail: ['Steeple', 'Skylight', 'Snow Guards', 'Solar Panels'],
  projectType: ['Residential', 'Commercial', 'Religious', 'Hospitality', 'Education']
}

const FilterSidebar = ({ selected, onChange, className = '' }) => {
  const handleToggle = (group, value) => {
    const current = new Set(selected[group])
    if (current.has(value)) {
      current.delete(value)
    } else {
      current.add(value)
    }
    onChange({ ...selected, [group]: Array.from(current) })
  }

  return (
    <aside className={`sidebar ${className}`.trim()}>
      {Object.entries(filters).map(([group, options]) => (
        <div key={group} className="filter-group">
          <h4 className="filter-title">{group}</h4>
          {options.map(opt => (
            <label key={opt} className="filter-option">
              <input
                type="checkbox"
                checked={selected[group].includes(opt)}
                onChange={() => handleToggle(group, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}
    </aside>
  )
}

export default FilterSidebar
