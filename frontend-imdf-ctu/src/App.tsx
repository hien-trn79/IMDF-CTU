import './App.css'
import Header from './components/Header'
import Content from './components/main/Content'
import Navbar from './components/navbar/Navbar'

function App() {
  return (
    <div className="app h-screen">
      <Header />

      <main className="app-main border border-gray-300 rounded-2xl p-2">
        <Navbar />

        <Content />
      </main>

      <footer className="app-footer border border-gray-300 rounded-2xl p-2">app footer</footer>
    </div>
  )
}

export default App
