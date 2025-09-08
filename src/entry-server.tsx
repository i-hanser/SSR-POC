import React from 'react'
import { App } from './main'
import { renderToString } from 'react-dom/server'

export function render(url: string, promoState: any) {
  return renderToString(<App promoState={promoState} />)
}
