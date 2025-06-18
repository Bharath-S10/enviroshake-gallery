import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import GalleryPage from './pages/GalleryPage'
import RoofGallery from './pages/RoofGallery'
import ProductDetail from './pages/ProductDetail'

function App() {
  return (
    <>
      <Header />
      <main className="p-6">
        <Routes>
          <Route path="/" element={
            <>
              <h2 className="text-2xl font-semibold text-gray-700">Welcome to the Enviroshake Roofing Gallery!</h2>
              <p className="mt-2 text-gray-500">Browse through premium composite roofing products below.</p>
            </>
          } />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/roof-gallery" element={<RoofGallery />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </main>
    </>
  )
}

export default App
