import { Link } from 'react-router-dom'

const TICKER_ITEMS = [
  { crop: 'Maize', price: '₦380/kg', state: 'Kaduna' },
  { crop: 'Cassava', price: '₦210/kg', state: 'Ogun' },
  { crop: 'Tomatoes', price: '₦450/kg', state: 'Kano' },
  { crop: 'Yam', price: '₦520/kg', state: 'Benue' },
  { crop: 'Rice', price: '₦610/kg', state: 'Kebbi' },
  { crop: 'Cashew', price: '₦890/kg', state: 'Oyo' },
  { crop: 'Ginger', price: '₦1,200/kg', state: 'Kaduna' },
  { crop: 'Sesame', price: '₦950/kg', state: 'Jigawa' },
  { crop: 'Cocoa', price: '₦2,100/kg', state: 'Ondo' },
  { crop: 'Plantain', price: '₦340/kg', state: 'Ogun' },
]

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'List or browse',
    body: 'Farmers post produce with photos, quantity, and price. Buyers search by crop, state, and price range.',
  },
  {
    n: '02',
    title: 'Message directly',
    body: 'No broker in between. Ask about harvest dates, quality, or negotiate — straight to the farmer or buyer.',
  },
  {
    n: '03',
    title: 'Get paid, get delivered',
    body: 'Buyers pay securely through the platform. Farmers get confirmed orders, not empty promises.',
  },
]

export default function Landing() {
  const doubledTicker = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div style={{ backgroundColor: 'var(--paper)' }} className="min-h-screen">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg" style={{ color: 'var(--ink)' }}>
          <span className="text-2xl">🌱</span>
          <span className="font-display">
            <span style={{ color: 'var(--crop-green)' }}>Agri</span>Connect
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: 'var(--ink)' }}>
            Sign in
          </Link>
          <Link to="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: 'var(--crop-green)' }}>
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-8 pb-14 text-center">
        <p className="font-mono-ticker text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--rust)' }}>
          Nigeria's farm-to-buyer exchange
        </p>
        <h1 className="font-display text-[2.75rem] sm:text-6xl leading-[1.05] font-semibold tracking-tight"
          style={{ color: 'var(--ink)' }}>
          Sell your harvest.<br />
          <span style={{ color: 'var(--crop-green)' }}>Skip the middleman.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed max-w-xl mx-auto" style={{ color: '#4B5245' }}>
          AgriConnect puts Nigerian farmers and buyers in direct contact — no
          brokers taking a cut, no guessing at fair prices. List produce,
          message directly, get paid.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/register"
            className="text-base font-semibold px-7 py-3.5 rounded-full text-white transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: 'var(--crop-green)' }}>
            Create free account
          </Link>
          <Link to="/login"
            className="text-base font-medium px-7 py-3.5 rounded-full border transition-colors"
            style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}>
            I already have an account
          </Link>
        </div>
      </section>

      <section className="overflow-hidden py-4" style={{ backgroundColor: 'var(--indigo)' }}>
        <div className="flex whitespace-nowrap ticker-track" style={{ width: 'max-content' }}>
          {doubledTicker.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-1 flex-shrink-0">
              <span className="font-mono-ticker text-xs" style={{ color: '#8B9AB8' }}>{item.crop}</span>
              <span className="font-mono-ticker text-sm font-medium" style={{ color: 'var(--gold)' }}>{item.price}</span>
              <span className="font-mono-ticker text-[10px]" style={{ color: '#5A6987' }}>{item.state}</span>
              <span style={{ color: '#3A4966' }}>·</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center mb-14" style={{ color: 'var(--ink)' }}>
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.n}>
              <div className="font-mono-ticker text-sm mb-3" style={{ color: 'var(--rust)' }}>{step.n}</div>
              <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5C6354' }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-3xl p-8" style={{ backgroundColor: '#E4EEE0' }}>
            <div className="text-3xl mb-4">🌾</div>
            <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>
              For farmers
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#4B5245' }}>
              Set your own price. Reach buyers across Nigeria, not just the
              trader who shows up at your gate. Get paid before produce leaves
              your farm.
            </p>
            <Link to="/register" className="text-sm font-semibold hover:underline" style={{ color: 'var(--crop-green)' }}>
              List your first crop →
            </Link>
          </div>
          <div className="rounded-3xl p-8" style={{ backgroundColor: '#EFE7D8' }}>
            <div className="text-3xl mb-4">🏪</div>
            <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>
              For buyers
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#4B5245' }}>
              Source directly from verified farmers. Compare prices by state,
              message before you commit, and know exactly who grew what
              you're buying.
            </p>
            <Link to="/register" className="text-sm font-semibold hover:underline" style={{ color: 'var(--rust)' }}>
              Browse fresh produce →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--indigo)' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-4">
            Ready to trade direct?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#9AA7C2' }}>
            Free to join. No commission on your first sale.
          </p>
          <Link to="/register"
            className="inline-block text-base font-semibold px-8 py-3.5 rounded-full transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--indigo)' }}>
            Create your free account
          </Link>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between text-xs"
        style={{ color: '#8A9182' }}>
        <span>© {new Date().getFullYear()} AgriConnect Nigeria</span>
        <div className="flex gap-2 items-center font-display font-semibold" style={{ color: 'var(--ink)' }}>
          <span>🌱</span> AgriConnect
        </div>
      </footer>
    </div>
  )
}