import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './main'

// Client obtains the server-injected state by reading attributes on SSR markup if needed.
// For the demo, we rely on SSR props embedded as data-* attributes where relevant.

const container = document.getElementById('root')!
hydrateRoot(container, <App />)
