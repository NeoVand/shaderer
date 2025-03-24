import { useState, useEffect } from 'react'
import { EditorTab } from '../../types'
import { TabBar } from './TabBar'
import { CodeEditor } from './CodeEditor'

interface EditorPanelProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onTabChange: (tabId: string) => void
  onCodeChange: (tabId: string, content: string) => void
}

export const EditorPanel = ({
  tabs,
  activeTabId,
  onTabChange,
  onCodeChange
}: EditorPanelProps) => {
  const [activeTab, setActiveTab] = useState<EditorTab | null>(null)
  
  useEffect(() => {
    if (activeTabId && tabs.length > 0) {
      const tab = tabs.find(tab => tab.id === activeTabId) || tabs[0]
      setActiveTab(tab)
      if (tab.id !== activeTabId) {
        onTabChange(tab.id)
      }
    } else if (tabs.length > 0) {
      setActiveTab(tabs[0])
      onTabChange(tabs[0].id)
    } else {
      setActiveTab(null)
    }
  }, [tabs, activeTabId, onTabChange])
  
  const handleCodeChange = (value: string) => {
    if (activeTab) {
      onCodeChange(activeTab.id, value)
    }
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={onTabChange}
      />
      
      <div style={{ 
        flex: '1 1 auto', 
        overflow: 'hidden', 
        minHeight: 0,
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {activeTab && (
          <CodeEditor
            value={activeTab.content}
            language={activeTab.type === 'fragment' || activeTab.type === 'vertex' ? 'glsl' : 'javascript'}
            onChange={handleCodeChange}
          />
        )}
      </div>
    </div>
  )
} 