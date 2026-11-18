// 显示配置弹窗：预览/保存按钮显隐 + 主题色。只作用于设计器外壳，画布纸张保持不变。
const PRESETS = [
  { key: 'auto', label: '跟随系统' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
]
const COLORS = [
  ['bg', '背景', '--pd-bg'],
  ['surface', '面板', '--pd-surface'],
  ['text', '文字', '--pd-text'],
  ['accent', '强调色', '--pd-accent'],
]

export default function ConfigDialog({
  visible, onClose,
  showPreview, setShowPreview, showSave, setShowSave,
  theme, setTheme, overrides, setOverrides,
}) {
  if (!visible) return null

  const setColor = (key, value) => setOverrides(prev => ({ ...prev, [key]: value }))
  const resetTheme = () => {
    setTheme('auto')
    setOverrides({ bg: '', surface: '', text: '', accent: '' })
  }

  return (
    <div className="config-mask" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="config-panel">
        <div className="config-head">
          <span className="config-title">显示配置</span>
          <span className="config-close" onClick={onClose}>×</span>
        </div>
        <div className="config-body">
          <section className="config-section">
            <div className="config-label">按钮显隐</div>
            <label className="config-row">
              <input type="checkbox" checked={showPreview} onChange={e => setShowPreview(e.target.checked)} />
              <span>显示「预览」按钮</span>
            </label>
            <label className="config-row">
              <input type="checkbox" checked={showSave} onChange={e => setShowSave(e.target.checked)} />
              <span>显示「保存」按钮</span>
            </label>
          </section>

          <section className="config-section">
            <div className="config-label">主题色</div>
            <div className="config-presets">
              {PRESETS.map(p => (
                <button key={p.key} type="button"
                        className={`config-preset${theme === p.key ? ' on' : ''}`}
                        onClick={() => setTheme(p.key)}>{p.label}</button>
              ))}
            </div>
            <div className="config-colors">
              {COLORS.map(([key, label]) => (
                <label key={key} className="config-color">
                  <span>{label}</span>
                  <input type="color" value={overrides[key] || '#ffffff'}
                         onChange={e => setColor(key, e.target.value)} />
                  <button type="button" className="config-color-clear" title="清除该项覆盖"
                          onClick={() => setColor(key, '')}>清空</button>
                </label>
              ))}
            </div>
            <button type="button" className="config-btn ghost" onClick={resetTheme}>重置配色</button>
          </section>
        </div>
        <div className="config-foot">
          <span className="config-tip">配色只改变设计器外壳，纸张与画布保持原样</span>
          <button type="button" className="config-btn" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  )
}
