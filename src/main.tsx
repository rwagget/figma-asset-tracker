/** @jsx figma.widget.h */

const { widget } = figma
const { AutoLayout, Text, Input, Rectangle, useSyncedState, register } = widget

type Asset = {
  id: string
  name: string
  url: string
  implemented: boolean
}

type NewRowState = {
  active: boolean
  name: string
  url: string
  stage: 'name' | 'url'
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function ImplementedToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <AutoLayout
      width={36}
      height={20}
      cornerRadius={10}
      fill={value ? '#4CAF50' : '#D9D9D9'}
      verticalAlignItems="center"
      horizontalAlignItems={value ? 'end' : 'start'}
      padding={{ left: 3, right: 3 }}
      onClick={() => onChange(!value)}
    >
      <AutoLayout width={14} height={14} cornerRadius={7} fill="#FFFFFF" />
    </AutoLayout>
  )
}

function AssetRow({
  asset,
  onToggle,
  onDelete,
  onEditName,
  onEditUrl,
}: {
  asset: Asset
  onToggle: () => void
  onDelete: () => void
  onEditName: (v: string) => void
  onEditUrl: (v: string) => void
}) {
  return (
    <AutoLayout
      width="fill-parent"
      height={44}
      verticalAlignItems="center"
      spacing={0}
      fill={asset.implemented ? '#F9F9F9' : '#FFFFFF'}
      stroke="#E5E5E5"
      strokeWidth={1}
      cornerRadius={6}
    >
      <AutoLayout width={180} height="fill-parent" verticalAlignItems="center" padding={{ left: 12, right: 8 }}>
        <Input
          value={asset.name}
          placeholder="Asset name"
          onTextEditEnd={(e) => onEditName(e.characters)}
          fontSize={13}
          fontFamily="Inter"
          fill={asset.implemented ? '#999999' : '#1A1A1A'}
          width="fill-parent"
          inputBehavior="truncate"
        />
      </AutoLayout>

      <Rectangle width={1} height={28} fill="#E5E5E5" />

      <AutoLayout width="fill-parent" height="fill-parent" verticalAlignItems="center" padding={{ left: 12, right: 8 }}>
        <Input
          value={asset.url}
          placeholder="https://..."
          onTextEditEnd={(e) => onEditUrl(e.characters)}
          fontSize={12}
          fontFamily="Inter"
          fill={asset.url ? '#0066CC' : '#AAAAAA'}
          width="fill-parent"
          inputBehavior="truncate"
        />
      </AutoLayout>

      <Rectangle width={1} height={28} fill="#E5E5E5" />

      <AutoLayout
        width={44}
        height="fill-parent"
        verticalAlignItems="center"
        horizontalAlignItems="center"
        opacity={asset.url ? 1 : 0.3}
        onClick={
          asset.url
            ? () => {
                const url = asset.url.startsWith('http') ? asset.url : 'https://' + asset.url
                figma.openExternal(url)
              }
            : undefined
        }
      >
        <Text fontSize={14} fontFamily="Inter">{'\u2197'}</Text>
      </AutoLayout>

      <Rectangle width={1} height={28} fill="#E5E5E5" />

      <AutoLayout width={64} height="fill-parent" verticalAlignItems="center" horizontalAlignItems="center">
        <ImplementedToggle value={asset.implemented} onChange={onToggle} />
      </AutoLayout>

      <Rectangle width={1} height={28} fill="#E5E5E5" />

      <AutoLayout
        width={36}
        height="fill-parent"
        verticalAlignItems="center"
        horizontalAlignItems="center"
        onClick={onDelete}
      >
        <Text fontSize={14} fontFamily="Inter" fill="#999999">{'\u2715'}</Text>
      </AutoLayout>
    </AutoLayout>
  )
}

function NewAssetRow({
  state,
  onNameConfirm,
  onUrlConfirm,
}: {
  state: NewRowState
  onNameConfirm: (v: string) => void
  onUrlConfirm: (v: string) => void
}) {
  return (
    <AutoLayout
      width="fill-parent"
      height={44}
      verticalAlignItems="center"
      spacing={0}
      fill="#F0F7FF"
      stroke="#99CAFF"
      strokeWidth={1}
      cornerRadius={6}
    >
      <AutoLayout width={180} height="fill-parent" verticalAlignItems="center" padding={{ left: 12, right: 8 }}>
        <Input
          value={state.name}
          placeholder="Asset name..."
          onTextEditEnd={(e) => onNameConfirm(e.characters)}
          fontSize={13}
          fontFamily="Inter"
          fill="#1A1A1A"
          width="fill-parent"
          inputBehavior="truncate"
        />
      </AutoLayout>

      <Rectangle width={1} height={28} fill="#99CAFF" />

      <AutoLayout width="fill-parent" height="fill-parent" verticalAlignItems="center" padding={{ left: 12, right: 8 }}>
        <Input
          value={state.url}
          placeholder="https://..."
          onTextEditEnd={(e) => onUrlConfirm(e.characters)}
          fontSize={12}
          fontFamily="Inter"
          fill="#0066CC"
          width="fill-parent"
          inputBehavior="truncate"
        />
      </AutoLayout>

      <Rectangle width={1} height={28} fill="#99CAFF" />

      <AutoLayout width={144} height="fill-parent" verticalAlignItems="center" horizontalAlignItems="center">
        <Text fontSize={10} fontFamily="Inter" fill="#0066CC">Press Enter to confirm</Text>
      </AutoLayout>
    </AutoLayout>
  )
}

function Widget() {
  const [assets, setAssets] = useSyncedState('assets', [] as Asset[])
  const [newRow, setNewRow] = useSyncedState('newRow', {
    active: false,
    name: '',
    url: '',
    stage: 'name',
  } as NewRowState)

  const notDone = assets.filter((a) => !a.implemented)
  const done = assets.filter((a) => a.implemented)
  const sortedAssets = [...notDone, ...done]
  const implemented = done.length
  const total = assets.length

  function handleAddAsset() {
    setNewRow({ active: true, name: '', url: '', stage: 'name' })
  }

  function handleNameConfirm(value: string) {
    const name = value.trim()
    if (!name) {
      setNewRow({ active: false, name: '', url: '', stage: 'name' })
      return
    }
    setNewRow({ active: true, name, url: '', stage: 'url' })
  }

  function handleUrlConfirm(value: string) {
    const url = value.trim()
    const name = newRow.name.trim()
    if (name) {
      setAssets([...assets, { id: generateId(), name, url, implemented: false }])
    }
    setNewRow({ active: false, name: '', url: '', stage: 'name' })
  }

  function handleToggle(id: string) {
    setAssets(assets.map((a) => (a.id === id ? { ...a, implemented: !a.implemented } : a)))
  }

  function handleDelete(id: string) {
    setAssets(assets.filter((a) => a.id !== id))
  }

  function handleEditName(id: string, name: string) {
    setAssets(assets.map((a) => (a.id === id ? { ...a, name } : a)))
  }

  function handleEditUrl(id: string, url: string) {
    setAssets(assets.map((a) => (a.id === id ? { ...a, url } : a)))
  }

  return (
    <AutoLayout
      direction="vertical"
      spacing={0}
      width={480}
      fill="#FFFFFF"
      cornerRadius={10}
      stroke="#E0E0E0"
      strokeWidth={1}
    >
      {/* Header */}
      <AutoLayout
        width="fill-parent"
        height={52}
        verticalAlignItems="center"
        spacing={8}
        padding={{ left: 16, right: 16 }}
        fill="#FAFAFA"
        stroke="#E5E5E5"
        strokeWidth={1}
      >
        <AutoLayout direction="vertical" spacing={2}>
          <Text fontSize={15} fontFamily="Inter" fill="#1A1A1A">Asset Tracker</Text>
          <Text fontSize={11} fontFamily="Inter" fill="#999999">{implemented + '/' + total + ' implemented'}</Text>
        </AutoLayout>
        <AutoLayout width="fill-parent" height={1} />
        <AutoLayout
          padding={{ left: 12, right: 12, top: 7, bottom: 7 }}
          fill="#1A1A1A"
          cornerRadius={6}
          onClick={handleAddAsset}
        >
          <Text fontSize={12} fontFamily="Inter" fill="#FFFFFF">+ New Asset</Text>
        </AutoLayout>
      </AutoLayout>

      {/* Column headers */}
      <AutoLayout
        width="fill-parent"
        height={32}
        verticalAlignItems="center"
        spacing={0}
        fill="#F5F5F5"
        stroke="#E5E5E5"
        strokeWidth={1}
      >
        <AutoLayout width={180} height="fill-parent" verticalAlignItems="center" padding={{ left: 12 }}>
          <Text fontSize={11} fontFamily="Inter" fill="#888888">NAME</Text>
        </AutoLayout>
        <Rectangle width={1} height={20} fill="#E5E5E5" />
        <AutoLayout width="fill-parent" height="fill-parent" verticalAlignItems="center" padding={{ left: 12 }}>
          <Text fontSize={11} fontFamily="Inter" fill="#888888">URL</Text>
        </AutoLayout>
        <Rectangle width={1} height={20} fill="#E5E5E5" />
        <AutoLayout width={44} height="fill-parent" verticalAlignItems="center" horizontalAlignItems="center">
          <Text fontSize={11} fontFamily="Inter" fill="#888888">{'\u2197'}</Text>
        </AutoLayout>
        <Rectangle width={1} height={20} fill="#E5E5E5" />
        <AutoLayout width={64} height="fill-parent" verticalAlignItems="center" horizontalAlignItems="center">
          <Text fontSize={11} fontFamily="Inter" fill="#888888">DONE</Text>
        </AutoLayout>
        <Rectangle width={1} height={20} fill="#E5E5E5" />
        <AutoLayout width={36} height="fill-parent" verticalAlignItems="center" horizontalAlignItems="center">
          <Text fontSize={11} fontFamily="Inter" fill="#888888">{'\u2014'}</Text>
        </AutoLayout>
      </AutoLayout>

      {/* Rows */}
      <AutoLayout
        direction="vertical"
        width="fill-parent"
        spacing={4}
        padding={{ left: 8, right: 8, top: 8, bottom: 8 }}
      >
        {newRow.active && (
          <NewAssetRow
            state={newRow}
            onNameConfirm={handleNameConfirm}
            onUrlConfirm={handleUrlConfirm}
          />
        )}

        {sortedAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            onToggle={() => handleToggle(asset.id)}
            onDelete={() => handleDelete(asset.id)}
            onEditName={(v) => handleEditName(asset.id, v)}
            onEditUrl={(v) => handleEditUrl(asset.id, v)}
          />
        ))}

        {assets.length === 0 && !newRow.active && (
          <AutoLayout width="fill-parent" height={60} verticalAlignItems="center" horizontalAlignItems="center">
            <Text fontSize={13} fontFamily="Inter" fill="#BBBBBB">
              No assets yet — click "+ New Asset" to get started
            </Text>
          </AutoLayout>
        )}
      </AutoLayout>
    </AutoLayout>
  )
}

register(Widget)
