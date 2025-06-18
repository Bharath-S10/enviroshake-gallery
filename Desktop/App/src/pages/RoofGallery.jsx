import React, { useState, useMemo } from 'react'
import FilterSidebar from '../components/FilterSidebar'
import { galleryData } from '../data/images'

const pageSize = 24

const initialState = {
  color: [],
  roofStyle: [],
  roofDetail: [],
  projectType: []
}

const matchesFilters = (item, filters) => {
  return Object.entries(filters).every(([group, values]) => {
    if (!values.length) return true
    if (group === 'roofDetail') {
      return values.every(v => item[group].includes(v))
    }
    return values.includes(item[group])
  })
}

const RoofGallery = () => {
  const [selected, setSelected] = useState(initialState)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(
    () => galleryData.filter(img => matchesFilters(img, selected)),
    [selected]
  )

  const pageCount = Math.ceil(filtered.length / pageSize)
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  const handleChange = newFilters => {
    setSelected(newFilters)
    setPage(1)
  }

  return (
    <div className="gallery-container">
      <button className="toggle-btn" onClick={() => setShowFilters(!showFilters)}>
        Filters
      </button>
      <FilterSidebar
        selected={selected}
        onChange={handleChange}
        className={showFilters ? 'show' : ''}
      />
      <div className="gallery-content">
        <div className="grid">
          {paged.map(item => (
            <div key={item.id} className="card">
              <img src={item.src} alt="roof" />
            </div>
          ))}
        </div>
        <div className="pagination">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              className={page === i + 1 ? 'active' : ''}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoofGallery
