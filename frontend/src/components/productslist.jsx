// App.jsx me aise use karein:
import React from 'react';
import ProductList from './components/ProductList';

function App() {
  return (
    <div>
      <header>
        <h1>Arzoo - Collection</h1>
      </header>
      <main>
        {/* Aapka product list grid yahan show hoga */}
        <ProductList />
      </main>
    </div>
  );
}

export default App;