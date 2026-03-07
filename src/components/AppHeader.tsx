import { useRef, useState } from 'react'
import { Map, Edit3, Download, FolderOpen, Save, Settings } from 'lucide-react'
import { Button } from './Button'
import { ImportConfirmationModal } from './ImportConfirmationModal'

export type TabType = 'map' | 'regions' | 'export' | 'advanced'

export interface TabItem {
  id: TabType
  label: string
  icon: typeof Map
}

interface AppHeaderProps {
  tabs: readonly TabItem[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onSave: () => void
  hasChanged: boolean
  hasExistingData: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function AppHeader({
  tabs,
  activeTab,
  onTabChange,
  onSave,
  hasChanged,
  hasExistingData,
  fileInputRef,
  onFileImport
}: AppHeaderProps) {
  const [showLoadModal, setShowLoadModal] = useState(false)

  const handleLoadClick = () => {
    if (hasExistingData) {
      setShowLoadModal(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const confirmLoad = () => {
    setShowLoadModal(false)
    fileInputRef.current?.click()
  }

  const cancelLoad = () => {
    setShowLoadModal(false)
  }

  return (
    <div className="flex items-center justify-between bg-eerie-back border-b border-gunmetal px-4 py-3">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`text-lg py-2 font-medium transition-colors flex items-center space-x-2 relative border-b-4 ${
                activeTab === tab.id
                  ? 'text-vista-blue border-vista-blue'
                  : 'text-gray-300 hover:text-white border-transparent'
              }`}
            >
              <IconComponent size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center">
        <img src="/map-on-anvil-3.png" alt="" className="h-14 mr-3" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 140, 50, 0.15)) drop-shadow(0 0 20px rgba(255, 140, 50, 0.1))' }} />
        <span className="text-4xl font-bold catamaran-extrabold" style={{
          background: 'linear-gradient(to bottom, #B0C8CB, #6A7D80)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 12px rgba(255, 140, 50, 0.3)) drop-shadow(0 0 24px rgba(255, 140, 50, 0.2))'
        }}>Region Forge</span>
      </div>

      <div className="flex items-center space-x-2">
        <a
          href="https://discord.gg/jhWemrA2xH"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mr-4"
        >
          <img src="/discord-symbol.svg" alt="Discord" className="w-6 h-6" />
          <span>Discord</span>
        </a>
        <Button
          variant="secondary-outline"
          onClick={handleLoadClick}
          leftIcon={<FolderOpen size={16} />}
        >
          Load
        </Button>
        <Button
          variant={hasChanged ? 'primary' : 'ghost'}
          onClick={onSave}
          leftIcon={<Save size={16} />}
        >
          Save
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onFileImport}
        className="hidden"
      />

      <ImportConfirmationModal
        isOpen={showLoadModal}
        onConfirm={confirmLoad}
        onCancel={cancelLoad}
        title="Load Project File"
        message="Loading a project file will replace all current data, including regions, map, and settings."
        showRegionOption={false}
        confirmLabel="Load Project"
      />
    </div>
  )
}
