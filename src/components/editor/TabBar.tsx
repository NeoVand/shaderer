import { EditorTab } from '../../types'

interface TabBarProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onTabClick: (tabId: string) => void
}

export const TabBar = ({ tabs, activeTabId, onTabClick }: TabBarProps) => {
  return (
    <div className="flex" style={{ 
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--bg-tertiary)' 
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="px-5 py-3 text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab.id === activeTabId ? 'var(--bg-secondary)' : 'transparent',
            color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab.id === activeTabId ? '2px solid var(--accent-blue)' : '2px solid transparent',
          }}
          onClick={() => onTabClick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
} 