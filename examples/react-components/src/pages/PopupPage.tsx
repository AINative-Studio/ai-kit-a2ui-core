import { useState } from 'react'
import { A2UIPopup } from '../components/A2UIPopup'

export function PopupPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<
    'center' | 'top' | 'bottom' | 'left' | 'right'
  >('center')
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md')

  return (
    <div className="page">
      <div className="page-header">
        <h1>A2UIPopup Component</h1>
        <p>Modal dialog component with flexible positioning and animations.</p>
      </div>

      <div className="demo-container">
        <div className="demo-controls">
          <div className="control-group">
            <label>Position:</label>
            <select
              value={position}
              onChange={(e) =>
                setPosition(
                  e.target.value as
                    | 'center'
                    | 'top'
                    | 'bottom'
                    | 'left'
                    | 'right'
                )
              }
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="control-group">
            <label>Size:</label>
            <select
              value={size}
              onChange={(e) =>
                setSize(e.target.value as 'sm' | 'md' | 'lg' | 'xl' | 'full')
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
              <option value="full">Full</option>
            </select>
          </div>

          <button className="demo-button" onClick={() => setIsOpen(true)}>
            Open Popup
          </button>
        </div>
      </div>

      <A2UIPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Popup"
        position={position}
        size={size}
        closeOnBackdrop={true}
        closeOnEscape={true}
        showCloseButton={true}
      >
        <div className="popup-content">
          <p>
            This is an example popup with position: <strong>{position}</strong>{' '}
            and size: <strong>{size}</strong>.
          </p>
          <p>
            Click outside, press Escape, or click the close button to close.
          </p>
          <div className="popup-actions">
            <button
              className="demo-button"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </A2UIPopup>

      <div className="features">
        <h2>Features</h2>
        <ul>
          <li>Multiple positions (center, top, bottom, left, right)</li>
          <li>Multiple sizes (sm, md, lg, xl, full)</li>
          <li>Close on backdrop click</li>
          <li>Close on Escape key</li>
          <li>Focus trap</li>
          <li>Smooth animations</li>
          <li>ARIA attributes</li>
          <li>Theme support</li>
        </ul>
      </div>
    </div>
  )
}
