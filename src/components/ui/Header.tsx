interface HeaderProps {
  projectName: string
  onSave: () => void
  onNew: () => void
  onOpenGallery: () => void
  onChangeName: (name: string) => void
  isSaved: boolean
}

export const Header = ({
  projectName,
  onSave,
  onNew,
  onOpenGallery,
  onChangeName,
  isSaved
}: HeaderProps) => {
  return (
    <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-gray-800" style={{ 
      backgroundColor: 'var(--bg-primary)', 
      borderColor: 'var(--bg-tertiary)'
    }}>
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Shaderer</h1>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onNew} 
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            New
          </button>
          
          <button 
            onClick={onSave} 
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: isSaved ? 'var(--bg-tertiary)' : 'var(--accent-green)' }}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
          
          <button 
            onClick={onOpenGallery} 
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent-purple)' }}
          >
            Gallery
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-300 text-sm">Project Name:</span>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onChangeName(e.target.value)}
          className="rounded px-3 py-1.5 text-sm min-w-[200px] focus:outline-none"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
        />
        {!isSaved && <span className="text-yellow-500 text-xs">*</span>}
      </div>
    </header>
  )
} 