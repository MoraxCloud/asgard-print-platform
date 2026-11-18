// 显示配置弹窗：预览/保存按钮显隐 + 主题预设。只作用于设计器外壳与工具栏，不影响出图业务。
export default function ConfigDialog({
  visible, onClose,
  showPreview, setShowPreview, showSave, setShowSave,
  themeMode, setThemeMode,
}) {
  if (!visible) return null

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
            <div className="config-label">主题</div>
            <label className="config-row">
              <input type="radio" name="config-theme" value="light" checked={themeMode === 'light'} onChange={() => setThemeMode('light')} />
              <span>亮色</span>
            </label>
            <label className="config-row">
              <input type="radio" name="config-theme" value="dark" checked={themeMode === 'dark'} onChange={() => setThemeMode('dark')} />
              <span>暗色</span>
            </label>
            <label className="config-row">
              <input type="radio" name="config-theme" value="auto" checked={themeMode === 'auto'} onChange={() => setThemeMode('auto')} />
              <span>跟随系统</span>
            </label>
          </section>
        </div>
        <div className="config-foot">
          <button type="button" className="config-btn" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  )
}
