export default function Header() {
  return (
    <div className="app-header py-4 pl-2 flex items-center gap-2 shadow h-full">
      <div className="logo-ctu">
        <img src="/ctu-logo.png" alt="CTU Logo" className="w-12 h-12 mr-2" />
      </div>
      <div className="web-name">
        <h1 className="text-2xl font-bold text-sky-600">CTUMapping</h1>
      </div>
    </div>
  )
}
