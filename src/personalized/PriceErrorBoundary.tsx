import React from 'react'

export class PriceErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.log('replace:error', { error: error.message })
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          <strong>个性化价格：</strong>
          <span style={{ color: '#b91c1c' }}>{this.state.error.message}</span>
          <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
            提示：在浏览器控制台运行 <code>localStorage.setItem('logged','1')</code> 再刷新，即可看到会员价生效。
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
