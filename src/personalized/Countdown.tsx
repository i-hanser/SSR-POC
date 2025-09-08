import React, { useEffect, useState } from 'react'

function pad(n: number) { return n.toString().padStart(2, '0') }

export function Countdown({ endAt }: { endAt: number }) {
  const calc = () => {
    const delta = Math.max(0, endAt - Date.now())
    const s = Math.floor(delta / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return { h, m, s: sec, done: delta === 0 }
  }
  const [t, setT] = useState(calc())
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [endAt])

  useEffect(() => {
    if (t.done) {
      // In real world, we could flip CTA or disable purchase
      console.log('⏰ Promotion ended')
    }
  }, [t.done])

  return <span className="countdown">{pad(t.h)}:{pad(t.m)}:{pad(t.s)}</span>
}
