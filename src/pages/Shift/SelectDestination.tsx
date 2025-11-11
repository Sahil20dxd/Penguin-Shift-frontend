// src/pages/Shift/SelectDestination.tsx
// --------------------------------------------------------------------
// Destination page: dynamically supports both directions
// (Spotify → YouTube OR YouTube → Spotify)
// Automatically determines the destination platform and handles linking,
// transfer, and unmatched downloads.
// --------------------------------------------------------------------
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  checkLinkStatus,
  getLinkUrl,
  listPlaylists,
  startTransfer,
  getTransferStatus,
  downloadUnmatchedCsv,
  downloadUnmatchedPdf
} from '@/components/shift/apiClient'
import { useShift } from '@/components/shift/ShiftContext'
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  Music2,
  Download,
  ArrowLeft
} from 'lucide-react'
import { createPageUrl } from '@/utils'

type Platform = 'spotify' | 'youtube'

// ✅ Helper: determine opposite platform automatically
function getOppositePlatform(source: Platform): Platform {
  return source === 'spotify' ? 'youtube' : 'spotify'
}

type DestPlaylist = {
  id: string
  name: string
  platform: Platform
  songCount: number
  coverImage?: string
}

export default function SelectDestination() {
  const { sourcePlatform, selectedPlaylistIds, includeTracks } = useShift()

  // ✅ Determine destination platform automatically
  const destinationPlatform: Platform = getOppositePlatform(
    sourcePlatform || 'spotify'
  )

  const [isDestLinked, setIsDestLinked] = useState(false)
  const [checkingLink, setCheckingLink] = useState(false)
  const [makeNewPlaylist, setMakeNewPlaylist] = useState(true)
  const [playlistName, setPlaylistName] = useState('My Transferred Playlist')
  const [playlistDesc, setPlaylistDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const [transferId, setTransferId] = useState<number | null>(null)
  const [transferPhase, setTransferPhase] = useState('Idle')
  const [transferPct, setTransferPct] = useState(0)
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const [destPlaylists, setDestPlaylists] = useState<DestPlaylist[]>([])
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  // ✅ On mount, check destination link
  useEffect(() => {
    void ensureDestinationLinked()
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [])

  // ✅ Generic link check for both platforms
  async function ensureDestinationLinked() {
    setCheckingLink(true)
    setError(null)
    try {
      const rs = (await checkLinkStatus(destinationPlatform)) as { linked: boolean }
      setIsDestLinked(Boolean(rs?.linked))
      if (rs?.linked) {
        const dest = (await listPlaylists(destinationPlatform)) as {
          items?: DestPlaylist[]
        }
        setDestPlaylists(dest?.items || [])
      }
    } catch (e: any) {
      console.error('Link check failed:', e)
      setError(
        `We couldn’t verify your ${destinationPlatform} connection. Please try reconnecting.`
      )
    } finally {
      setCheckingLink(false)
    }
  }

  // ✅ Handle OAuth linking (works for both Spotify / YouTube)
  async function handleLinkDestination() {
    setError(null)
    try {
      const resp = (await getLinkUrl(destinationPlatform)) as { url: string }
      if (!resp?.url) {
        setError(`Could not get ${destinationPlatform} authorization URL.`)
        return
      }

      const popup = window.open(
        resp.url,
        `${destinationPlatform}-oauth`,
        'width=600,height=700,scrollbars=yes'
      )
      if (!popup) {
        setError('Please allow popups in your browser.')
        return
      }

      const poll = window.setInterval(async () => {
        if (popup.closed) {
          clearInterval(poll)
          await ensureDestinationLinked()
          return
        }
        try {
          const s = (await checkLinkStatus(destinationPlatform)) as { linked: boolean }
          if (s?.linked) {
            clearInterval(poll)
            popup.close()
            setIsDestLinked(true)
            const dest = (await listPlaylists(destinationPlatform)) as {
              items?: DestPlaylist[]
            }
            setDestPlaylists(dest?.items || [])
          }
        } catch {}
      }, 1200)

      window.setTimeout(() => clearInterval(poll), 120000)
    } catch (e: any) {
      console.error('OAuth connection failed:', e)
      setError(`We couldn’t connect to ${destinationPlatform}. Please try again.`)
    } finally {
      setCheckingLink(false)
    }
  }

  // ✅ Handle starting the transfer
  async function handleStartTransfer() {
    setCreating(true)
    setError(null)
    try {
      const payload = {
        sourcePlatform: sourcePlatform || 'spotify',
        destinationPlatform,
        playlistIds: selectedPlaylistIds,
        createNew: makeNewPlaylist,
        newPlaylistName: playlistName,
        newPlaylistDescription: playlistDesc,
        includeTracks
      }

      const res = (await startTransfer(payload)) as {
        id: number
        createdPlaylistId?: string
      }

      setTransferId(res.id)
      if (res.createdPlaylistId) setCreatedPlaylistId(res.createdPlaylistId)

      // Begin polling status
      if (pollRef.current) window.clearInterval(pollRef.current)
      pollRef.current = window.setInterval(async () => {
        try {
          const st = (await getTransferStatus(res.id)) as {
            status: string
            percent: number
            phase: string
            unmatched: number
            createdPlaylistId?: string
          }
          setTransferPhase(st.phase)
          setTransferPct(st.percent)
          setUnmatchedCount(st.unmatched || 0)
          if (st.createdPlaylistId) setCreatedPlaylistId(st.createdPlaylistId)

          if (st.status === 'COMPLETED' || st.status === 'FAILED') {
            if (pollRef.current) window.clearInterval(pollRef.current)
            const dest = (await listPlaylists(destinationPlatform)) as {
              items?: DestPlaylist[]
            }
            setDestPlaylists(dest?.items || [])
          }
        } catch {
          if (pollRef.current) window.clearInterval(pollRef.current)
        }
      }, 1200) as unknown as number
    } catch (e: any) {
      console.error('Transfer start failed:', e)
      setError(
        'We couldn’t start the transfer. Please check your connection and try again.'
      )
    } finally {
      setCreating(false)
    }
  }

  // ✅ Unmatched downloads
  async function handleDownloadCsv() {
    if (!transferId) return
    try {
      await downloadUnmatchedCsv(transferId)
    } catch {
      setError('Could not download unmatched songs CSV.')
    }
  }

  async function handleDownloadPdf() {
    if (!transferId) return
    try {
      await downloadUnmatchedPdf(transferId)
    } catch {
      setError('Could not download unmatched songs PDF.')
    }
  }

  const canStart =
    isDestLinked &&
    selectedPlaylistIds.length > 0 &&
    (!makeNewPlaylist || playlistName.trim().length > 0)

  const destName =
    destinationPlatform === 'youtube' ? 'YouTube Music' : 'Spotify'

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-900'>Select Destination</h1>
          <Link to={createPageUrl('SelectPlaylist')}>
            <Button variant='outline'>
              <ArrowLeft className='w-4 h-4 mr-2' /> Back
            </Button>
          </Link>
        </div>

        {error && (
          <div
            role='alert'
            className='mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm'
          >
            {error}
          </div>
        )}

        <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
          <div className='mb-4 text-sm text-gray-600'>
            {selectedPlaylistIds.length} playlist
            {selectedPlaylistIds.length !== 1 ? 's' : ''} selected for transfer
          </div>

          {checkingLink ? (
            <div className='text-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2 text-purple-600' />
              Checking {destName} link…
            </div>
          ) : !isDestLinked ? (
            <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
              <ExternalLink className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <p className='text-gray-600 mb-4'>
                Connect your {destName} account to continue
              </p>
              <Button
                onClick={() => void handleLinkDestination()}
                className='bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
              >
                Connect {destName}
              </Button>
            </div>
          ) : (
            <>
              <div className='flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200'>
                <CheckCircle2 className='w-5 h-5 text-green-600' />
                <span className='text-green-700 font-medium'>
                  Connected to {destName}
                </span>
              </div>

              <label className='flex items-center gap-2 mb-4'>
                <input
                  type='checkbox'
                  checked={makeNewPlaylist}
                  onChange={(e) => setMakeNewPlaylist(e.target.checked)}
                />
                <span className='font-medium'>
                  Create new playlist on {destName}
                </span>
              </label>

              {makeNewPlaylist && (
                <div className='space-y-3 mb-6'>
                  <div>
                    <div className='text-sm mb-1'>Playlist Name *</div>
                    <Input
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      placeholder='My Transferred Playlist'
                    />
                  </div>
                  <div>
                    <div className='text-sm mb-1'>Description (optional)</div>
                    <textarea
                      className='w-full border rounded-md px-3 py-2'
                      rows={4}
                      value={playlistDesc}
                      onChange={(e) => setPlaylistDesc(e.target.value)}
                      placeholder='Describe your playlist…'
                    />
                  </div>
                </div>
              )}

              <div className='flex justify-end'>
                <Button
                  disabled={!canStart || creating}
                  onClick={() => void handleStartTransfer()}
                  className='bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50'
                >
                  {creating && (
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  )}
                  Start Transfer
                </Button>
              </div>

              {transferId && (
                <div className='mt-8 border-t pt-6'>
                  <div className='text-sm text-gray-600 mb-2'>
                    Transfer #{transferId} • Phase:{' '}
                    <span className='font-medium'>{transferPhase}</span> •{' '}
                    {transferPct}%
                  </div>

                  {destPlaylists.length > 0 && (
                    <div className='space-y-2'>
                      <div className='text-sm font-semibold text-gray-700'>
                        Your {destName} playlists
                      </div>
                      <div className='grid grid-cols-1 gap-2'>
                        {destPlaylists.map((p) => (
                          <div
                            key={p.id}
                            className={
                              'flex items-center gap-3 p-3 border rounded-lg ' +
                              (createdPlaylistId === p.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200')
                            }
                          >
                            <div className='w-10 h-10 rounded bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center overflow-hidden'>
                              {p.coverImage ? (
                                <img
                                  src={p.coverImage}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <Music2 className='w-5 h-5 text-white' />
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium truncate'>
                                {p.name}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {p.songCount} songs
                              </div>
                            </div>
                            {createdPlaylistId === p.id && (
                              <div className='text-xs font-semibold text-purple-700'>
                                NEW
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='mt-6 flex items-center gap-3'>
                    <div className='text-sm text-gray-700'>
                      Unmatched songs:{' '}
                      <span className='font-semibold'>{unmatchedCount}</span>
                    </div>
                    <Button
                      variant='outline'
                      onClick={() => void handleDownloadCsv()}
                      disabled={!transferId}
                    >
                      <Download className='w-4 h-4 mr-2' /> CSV
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => void handleDownloadPdf()}
                      disabled={!transferId}
                    >
                      <Download className='w-4 h-4 mr-2' /> PDF
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
