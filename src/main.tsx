/** @jsx figma.widget.h */

const { widget } = figma
const { AutoLayout, Text, Input, Rectangle, SVG, useSyncedState, useEffect, waitForTask, register } = widget

type Status = 'Pending' | 'Ready To Use' | 'Implemented'

type Asset = {
  id: string
  name: string
  url: string
  status: Status
  sortKey: number
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function statusColor(status: Status): string {
  if (status === 'Ready To Use') return '#0052CC'
  if (status === 'Implemented') return '#1A7F3C'
  return '#92400E'
}

function statusPillBg(status: Status): string {
  if (status === 'Ready To Use') return '#DBEAFE'
  if (status === 'Implemented') return '#DCFCE7'
  return '#FEF3C7'
}

function statusBg(status: Status): string {
  if (status === 'Implemented') return '#FAFAFA'
  return '#FDFDFD'
}

function statusOrder(status: Status): number {
  if (status === 'Ready To Use') return 0
  if (status === 'Pending') return 1
  return 2
}

function nextStatus(status: Status): Status {
  if (status === 'Pending') return 'Ready To Use'
  if (status === 'Ready To Use') return 'Implemented'
  return 'Pending'
}

function StatusPill({ status, onClick }: { status: Status; onClick: () => void }) {
  return (
    <AutoLayout
      padding={{ left: 8, right: 8, top: 4, bottom: 4 }}
      fill={statusPillBg(status)}
      cornerRadius={4}
      onClick={onClick}
    >
      <Text fontSize={11} fontFamily="Inter" fill={statusColor(status)}>
        {status}
      </Text>
    </AutoLayout>
  )
}

function TrashIcon({ onClick }: { onClick: () => void }) {
  return (
    <AutoLayout
      width={30}
      height={30}
      verticalAlignItems="center"
      horizontalAlignItems="center"
      cornerRadius={15}
      fill="#FDFDFD"
      stroke="#E0E0E0"
      strokeWidth={1}
      onClick={onClick}
      opacity={0.7}
    >
      <SVG
        width={14}
        height={14}
        src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111111"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
      />
    </AutoLayout>
  )
}

function OpenUrlIcon({ onClick, disabled }: { onClick?: () => void; disabled: boolean }) {
  return (
    <AutoLayout
      width={30}
      height={30}
      verticalAlignItems="center"
      horizontalAlignItems="center"
      cornerRadius={15}
      fill="#FDFDFD"
      stroke="#E0E0E0"
      strokeWidth={1}
      onClick={onClick}
      opacity={disabled ? 0.3 : 0.7}
    >
      <SVG
        width={14}
        height={14}
        src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111111"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>'
      />
    </AutoLayout>
  )
}

function AssetRow({
  asset,
  isLast,
  onStatusChange,
  onDelete,
  onEditName,
  onEditUrl,
}: {
  asset: Asset
  isLast: boolean
  onStatusChange: () => void
  onDelete: () => void
  onEditName: (v: string) => void
  onEditUrl: (v: string) => void
}) {
  const isPlaceholderUrl = asset.url === 'URL to asset'

  return (
    <AutoLayout
      direction="vertical"
      width="fill-parent"
      spacing={0}
      fill={statusBg(asset.status)}
    >
      <AutoLayout
        width="fill-parent"
        height={60}
        verticalAlignItems="center"
        spacing={0}
        padding={{ left: 20, right: 12 }}
      >
        {/* Name */}
        <AutoLayout width={200} height="fill-parent" verticalAlignItems="center" padding={{ right: 16 }}>
          <Input
            value={asset.name}
            placeholder="Asset name"
            onTextEditEnd={(e) => onEditName(e.characters)}
            fontSize={14}
            fontFamily="Inter"
            fill={asset.status === 'Implemented' ? '#999999' : '#111111'}
            width="fill-parent"
            inputBehavior="truncate"
          />
        </AutoLayout>

        {/* Status pill */}
        <AutoLayout width={130} height="fill-parent" verticalAlignItems="center">
          <StatusPill status={asset.status} onClick={onStatusChange} />
        </AutoLayout>

        {/* URL */}
        <AutoLayout width="fill-parent" height="fill-parent" verticalAlignItems="center" padding={{ right: 12 }}>
          <Input
            value={asset.url}
            placeholder="URL to asset"
            onTextEditEnd={(e) => onEditUrl(e.characters)}
            fontSize={13}
            fontFamily="Inter"
            fill={isPlaceholderUrl ? '#BBBBBB' : '#000000'}
            width="fill-parent"
            inputBehavior="truncate"
          />
        </AutoLayout>

        {/* Open URL */}
        <OpenUrlIcon
          disabled={isPlaceholderUrl}
          onClick={
            !isPlaceholderUrl
              ? () => {
                  const url = asset.url.startsWith('http') ? asset.url : 'https://' + asset.url
                  figma.openExternal(url)
                }
              : undefined
          }
        />

        {/* Spacer between icons */}
        <AutoLayout width={10} height={1} />

        {/* Delete */}
        <TrashIcon onClick={onDelete} />
      </AutoLayout>

      {/* Row divider */}
      {!isLast && <Rectangle width="fill-parent" height={1} fill="#F0F0F0" />}
    </AutoLayout>
  )
}

function Widget() {
  const [assets, setAssets] = useSyncedState('assets', [] as Asset[])
  const [pendingSort, setPendingSort] = useSyncedState('pendingSort', false)

  const sortedAssets = [...assets].sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
    return statusOrder(a.status) - statusOrder(b.status)
  })

  const implemented = assets.filter((a) => a.status === 'Implemented').length
  const total = assets.length

  useEffect(() => {
    if (!pendingSort) return
    waitForTask(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          setAssets(
            assets
              .slice()
              .sort((a, b) => statusOrder(a.status) - statusOrder(b.status))
              .map((a, i) => ({ ...a, sortKey: i }))
          )
          setPendingSort(false)
          resolve()
        }, 2000)
      })
    )
  })

  function handleAddAsset() {
    setAssets([
      ...assets,
      {
        id: generateId(),
        name: 'Asset name',
        url: 'URL to asset',
        status: 'Pending',
        sortKey: assets.length,
      },
    ])
  }

  function handleStatusChange(id: string) {
    setAssets(assets.map((a) => (a.id === id ? { ...a, status: nextStatus(a.status) } : a)))
    setPendingSort(true)
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
      width={560}
      fill="#FDFDFD"
      cornerRadius={12}
      effect={[{
        type: 'drop-shadow',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 2 },
        blur: 16,
        spread: 0,
      }]}
    >
      {/* Header */}
      <AutoLayout
        width="fill-parent"
        height={60}
        verticalAlignItems="center"
        spacing={8}
        padding={{ left: 20, right: 16 }}
      >
        <AutoLayout direction="vertical" spacing={2}>
          <Text fontSize={18} fontFamily="Inter" fill="#111111">Asset Tracker</Text>
          <Text fontSize={12} fontFamily="Inter" fill="#999999">
            {total === 0 ? 'No assets yet' : implemented + ' of ' + total + ' implemented'}
          </Text>
        </AutoLayout>
        <AutoLayout width="fill-parent" height={1} />
        <AutoLayout
          padding={{ left: 14, right: 14, top: 8, bottom: 8 }}
          fill="#222222"
          cornerRadius={8}
          onClick={handleAddAsset}
        >
          <Text fontSize={13} fontFamily="Inter" fill="#FFFFFF">+ New Asset</Text>
        </AutoLayout>
      </AutoLayout>

      {/* Progress bar */}
      <AutoLayout
        width="fill-parent"
        height={20}
        verticalAlignItems="center"
        padding={{ left: 20, right: 20 }}
      >
        <AutoLayout width="fill-parent" height={6} fill="#F0F0F0" cornerRadius={3}>
          <AutoLayout
            width={total === 0 ? 0 : Math.round((implemented / total) * 520)}
            height={6}
            fill="#39AD60"
            cornerRadius={3}
          />
        </AutoLayout>
      </AutoLayout>

      {/* Column headers */}
      <AutoLayout
        width="fill-parent"
        height={36}
        verticalAlignItems="center"
        spacing={0}
        padding={{ left: 20, right: 12 }}
        fill="#FDFDFD"
      >
        <AutoLayout width={200} height="fill-parent" verticalAlignItems="center" padding={{ right: 16 }}>
          <Text fontSize={11} fontFamily="Inter" fill="#999999" letterSpacing={0.8}>NAME</Text>
        </AutoLayout>
        <AutoLayout width={130} height="fill-parent" verticalAlignItems="center">
          <Text fontSize={11} fontFamily="Inter" fill="#999999" letterSpacing={0.8}>STATUS</Text>
        </AutoLayout>
        <AutoLayout width="fill-parent" height="fill-parent" verticalAlignItems="center">
          <Text fontSize={11} fontFamily="Inter" fill="#999999" letterSpacing={0.8}>URL</Text>
        </AutoLayout>
        <AutoLayout width={72} height="fill-parent" />
      </AutoLayout>

      {/* Header / rows divider */}
      <Rectangle width="fill-parent" height={1} fill="#EEEEEE" />

      {/* Rows */}
      <AutoLayout direction="vertical" width="fill-parent" spacing={0}>
        {sortedAssets.map((asset, i) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            isLast={i === sortedAssets.length - 1}
            onStatusChange={() => handleStatusChange(asset.id)}
            onDelete={() => handleDelete(asset.id)}
            onEditName={(v) => handleEditName(asset.id, v)}
            onEditUrl={(v) => handleEditUrl(asset.id, v)}
          />
        ))}

        {assets.length === 0 && (
          <AutoLayout
            width="fill-parent"
            height={80}
            verticalAlignItems="center"
            horizontalAlignItems="center"
          >
            <Text fontSize={13} fontFamily="Inter" fill="#CCCCCC">
              No assets yet — click "+ New Asset" to get started
            </Text>
          </AutoLayout>
        )}
      </AutoLayout>
    </AutoLayout>
  )
}

register(Widget)
