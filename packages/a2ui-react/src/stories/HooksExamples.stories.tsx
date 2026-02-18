import type { Meta, StoryObj } from '@storybook/react'
import { useHumanInTheLoop } from '../hooks/useHumanInTheLoop'
import { useState } from 'react'

const meta: Meta = {
  title: 'Hooks/Examples',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// Human-in-the-Loop Example
export const HumanInTheLoopExample: StoryObj = {
  render: () => {
    const hitl = useHumanInTheLoop<{ action: string; details: string }>()
    const [result, setResult] = useState<string>('')

    async function handleAction() {
      setResult('Requesting approval...')
      const approved = await hitl.requestApproval(
        'dangerous-action',
        {
          action: 'Delete Database',
          details: 'This will permanently delete all data'
        },
        30000
      )
      setResult(approved ? 'Action approved!' : 'Action rejected!')
    }

    return (
      <div style={{ padding: '2rem', maxWidth: '400px' }}>
        <h2>Human-in-the-Loop Demo</h2>
        <button
          onClick={handleAction}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          Perform Dangerous Action
        </button>

        {result && (
          <p style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
            {result}
          </p>
        )}

        {hitl.pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            style={{
              marginTop: '1rem',
              padding: '1rem',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              background: '#fffbeb'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Approval Required</h3>
            <p style={{ margin: '0.5rem 0' }}><strong>{approval.data.action}</strong></p>
            <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>{approval.data.details}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => hitl.approve(approval.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>
              <button
                onClick={() => hitl.reject(approval.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  },
}
