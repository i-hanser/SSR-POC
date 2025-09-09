import React from 'react'

export function Skeleton({ width, height }: { width?: number | string; height?: number | string }) {
  return <div className="skeleton" style={{ width, height }} aria-hidden="true"></div>
}
