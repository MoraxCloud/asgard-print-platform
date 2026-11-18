// 显示配置弹窗：预览/保存按钮显隐。只作用于设计器工具栏按钮，不影响出图业务。
export default function ConfigDialog({
  visible, onClose,
  showPreview, setShowPreview, showSave, setShowSave,
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
        </div>
        <div className="config-foot">
          <button type="button" className="config-btn" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  )
}
