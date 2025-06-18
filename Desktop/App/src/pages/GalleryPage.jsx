import React from 'react'
import { Link } from 'react-router-dom' // ✅ Add this import

const products = [
  {
    id: 1,
    name: 'Enviroshake',
    image: '/assets/product1.jpg', // ✅ Fixed image path
    description: 'Authentic cedar look with long-lasting composite material.'
  },
  {
    id: 2,
    name: 'Enviroshingle',
    image: '/assets/product2.jpg',
    description: 'A durable alternative to traditional shingles.'
  },
  {
    id: 3,
    name: 'Enviroslate',
    image: '/assets/product3.jpg',
    description: 'Modern composite slate for elegant roofing.'
  }
]

const GalleryPage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Product Gallery</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {products.map(product => (
          <Link
            to={`/product/${product.id}`}
            key={product.id}
            className="block bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-48 w-full object-cover rounded-t-xl"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{product.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default GalleryPage
