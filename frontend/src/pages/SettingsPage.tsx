import { useRef, useState } from 'react'
import { Buildings, Invoice, UsersThree, Bell, Gear, Palette } from '@phosphor-icons/react'

const NAV_ITEMS = [
  { id: 'business', label: 'Business Profile', icon: <Buildings size={16} /> },
  { id: 'tax', label: 'Tax Settings', icon: <Gear size={16} /> },
  { id: 'invoice', label: 'Invoice', icon: <Invoice size={16} /> },
  { id: 'units', label: 'Units & UOM', icon: <Gear size={16} /> },
  { id: 'users', label: 'Users & Roles', icon: <UsersThree size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('business')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoFileName, setLogoFileName] = useState('')
  const [lastSaved, setLastSaved] = useState('just now')
  const [store, setStore] = useState({
    name: 'Sharma General Store',
    type: 'General Store',
    email: 'sharma.store@email.com',
    phone: '+91 98765 43210',
    address: '23, MG Road, Near City Mall',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    gstin: '29ABCDE1234F1Z5',
  })

  const [savedStore, setSavedStore] = useState(store)

  const handleDiscard = () => {
    setStore(savedStore)
  }

  const handleSave = () => {
    setSavedStore(store)
    setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1100px]">
      {/* Left nav */}
      <div className="w-full lg:w-52 flex-shrink-0">
        <div className="card">
          <nav className="p-2 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-DEFAULT text-sm font-medium transition-all text-left ${activeSection === item.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'}`}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 space-y-5">
        {activeSection === 'business' && (
          <>
            <div>
              <h1 className="page-title">Business Profile</h1>
              <p className="page-subtitle">Manage your store information</p>
            </div>

            <div className="card p-6 space-y-5">
              {/* Logo */}
              <div>
                <p className="label">Store Logo</p>
                <div
                  className="border-2 border-dashed border-border rounded-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => logoInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      logoInputRef.current?.click()
                    }
                  }}
                >
                  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-2">S</div>
                  <p className="text-sm font-medium text-text-primary">Click to upload logo</p>
                  <p className="text-xs text-text-muted mt-0.5">PNG, JPG up to 5 MB</p>
                  {logoFileName && <p className="text-xs text-text-secondary mt-1">Selected: {logoFileName}</p>}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    setLogoFileName(file?.name ?? '')
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Store Name</label>
                  <input className="input" value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Business Type</label>
                  <select className="input select-input" value={store.type} onChange={e => setStore({ ...store, type: e.target.value })}>
                    <option>General Store</option>
                    <option>Grocery</option>
                    <option>Pharmacy</option>
                    <option>Electronics</option>
                    <option>Clothing</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={store.email} onChange={e => setStore({ ...store, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={store.phone} onChange={e => setStore({ ...store, phone: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <input className="input" value={store.address} onChange={e => setStore({ ...store, address: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">City</label>
                  <input className="input" value={store.city} onChange={e => setStore({ ...store, city: e.target.value })} />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" value={store.state} onChange={e => setStore({ ...store, state: e.target.value })} />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input className="input" value={store.pincode} onChange={e => setStore({ ...store, pincode: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">GSTIN</label>
                <div className="flex items-center gap-2">
                  <input className="input flex-1" value={store.gstin} onChange={e => setStore({ ...store, gstin: e.target.value })} />
                  <span className="chip-success text-[10px] whitespace-nowrap">
                    ✓ Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky save bar */}
            <div className="sticky bottom-4 flex flex-wrap items-center gap-3 p-4 bg-surface/90 backdrop-blur-md border border-border rounded-card">
              <span className="text-xs text-text-muted italic">Last saved: {lastSaved}</span>
              <button className="btn-secondary btn-sm" onClick={handleDiscard}>Discard Changes</button>
              <button className="btn-primary btn-sm ml-auto" onClick={handleSave}>Save Profile</button>
            </div>
          </>
        )}

        {activeSection !== 'business' && (
          <div className="space-y-4">
            <div>
              <h1 className="page-title">{NAV_ITEMS.find(n => n.id === activeSection)?.label}</h1>
              <p className="page-subtitle">Configuration controls for this section</p>
            </div>

            {activeSection === 'tax' && (
              <div className="card p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Default GST Rate (%)</label>
                    <input className="input" defaultValue="18" type="number" min="0" />
                  </div>
                  <div>
                    <label className="label">Tax Mode</label>
                    <select className="input select-input" defaultValue="inclusive">
                      <option value="inclusive">Tax Inclusive</option>
                      <option value="exclusive">Tax Exclusive</option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary btn-sm" onClick={() => setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}>Save Tax Settings</button>
              </div>
            )}

            {activeSection === 'invoice' && (
              <div className="card p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Invoice Prefix</label>
                    <input className="input" defaultValue="INV" />
                  </div>
                  <div>
                    <label className="label">Footer Note</label>
                    <input className="input" defaultValue="Thank you for your purchase" />
                  </div>
                </div>
                <button className="btn-primary btn-sm" onClick={() => setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}>Save Invoice Settings</button>
              </div>
            )}

            {activeSection === 'units' && (
              <div className="card p-6">
                <p className="text-sm text-text-secondary mb-4">Common stock units used across products.</p>
                <div className="flex flex-wrap gap-2">
                  {['pcs', 'kg', 'ltr', 'box', 'pack'].map((u) => (
                    <span key={u} className="chip-neutral">{u}</span>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="card p-6">
                <p className="text-sm text-text-secondary mb-4">Role access overview for current workspace.</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>Owner</span><span className="chip-success">Full Access</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Manager</span><span className="chip-neutral">Operations + Reports</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Staff</span><span className="chip-neutral">POS + Limited Inventory</span></div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="card p-6 space-y-3">
                <label className="flex items-center justify-between text-sm">
                  <span>Low stock alerts</span>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>Daily sales summary</span>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>Purchase reminders</span>
                  <input type="checkbox" />
                </label>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="card p-6 space-y-4">
                <div>
                  <label className="label">Theme</label>
                  <select className="input select-input" defaultValue="light">
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <button className="btn-primary btn-sm" onClick={() => setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}>Apply Appearance</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
