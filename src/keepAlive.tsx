import React, { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const cache = new Map<string, HTMLElement>()
let root: HTMLElement | null = null

function ensureRoot() {
  if (typeof document === 'undefined') return null
  if (!root) {
    root = document.createElement('div')
    root.id = '__keepalive__'
    root.style.display = 'none'
    document.body.appendChild(root)
  }
  return root
}

function Holder({ id, node }: { id: string; node: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const root = ensureRoot()
  let el = cache.get(id)
  if (!el && root) {
    el = document.createElement('div')
    root.appendChild(el)
    cache.set(id, el)
  }

  useEffect(() => {
    const container = cache.get(id)
    if (ref.current && container && container.parentElement !== ref.current) {
      ref.current.appendChild(container)
    }
    return () => {
      const root = ensureRoot()
      if (container && root && container.parentElement !== root) {
        root.appendChild(container)
      }
    }
  }, [id])

  if (el) {
    return <span ref={ref}>{createPortal(node, el)}</span>
  }
  return <>{node}</>
}

export function mount(node: ReactNode, id: string) {
  if (typeof document === 'undefined') return node
  return <Holder id={id} node={node} />
}

export function unmount(id: string) {
  const root = ensureRoot()
  const container = cache.get(id)
  if (root && container && container.parentElement !== root) {
    root.appendChild(container)
  }
}

export function destroy(id: string) {
  const container = cache.get(id)
  if (container) {
    container.remove()
    cache.delete(id)
  }
}
