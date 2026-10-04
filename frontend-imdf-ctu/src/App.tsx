import './App.css'
import Header from './components/Header'
import PageHeader from './components/layout/PageHeader'
import PageMain from './components/layout/PageMain'
import Content from './components/main/Content'
import Navbar from './components/navbar/Navbar'

function App() {
  return (
    // <div className="app h-screen">
    //   <Header />

    //   <main className="app-main border border-gray-300 rounded-2xl p-2">
    //     <Navbar />

    //     <Content />
    //   </main>

    //   <footer className="app-footer border border-gray-300 rounded-2xl p-2">app footer</footer>
    // </div>
    <div className="page">
      {/* Header */}
      <PageHeader />
      <PageMain />
    </div>
  )
}

export default App
