import axios from 'axios'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`

// Cloudflare Stream types
export interface CloudflareVideo {
  uid: string
  thumbnail: string
  thumbnailTimestampPct: number
  readyToStream: boolean
  status: {
    state: string
    pctComplete: string
    errorReasonCode?: string
    errorReasonText?: string
  }
  meta: {
    name?: string
    [key: string]: any
  }
  created: string
  modified: string
  size: number
  preview: string
  allowedOrigins: string[]
  requireSignedURLs: boolean
  uploaded: string
  uploadExpiry: string | null
  maxSizeBytes: number
  maxDurationSeconds: number
  duration: number
  input: {
    width: number
    height: number
  }
  playback: {
    hls: string
    dash: string
  }
  watermark?: {
    uid: string
  }
}

/**
 * Upload video to Cloudflare Stream via URL
 */
export async function uploadVideoFromUrl(url: string, metadata?: Record<string, any>) {
  try {
    const response = await axios.post(
      API_BASE,
      {
        url,
        meta: metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.result as CloudflareVideo
  } catch (error) {
    console.error('Error uploading video to Cloudflare:', error)
    throw new Error('Failed to upload video')
  }
}

/**
 * Upload video via direct upload
 * Returns upload URL for client-side upload
 */
export async function createDirectUploadUrl(metadata?: Record<string, any>) {
  try {
    const response = await axios.post(
      `${API_BASE}/direct_upload`,
      {
        maxDurationSeconds: 21600, // 6 hours max
        meta: metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.result as {
      uploadURL: string
      uid: string
    }
  } catch (error) {
    console.error('Error creating direct upload URL:', error)
    throw new Error('Failed to create upload URL')
  }
}

/**
 * Get video details
 */
export async function getVideoDetails(videoId: string): Promise<CloudflareVideo> {
  try {
    const response = await axios.get(`${API_BASE}/${videoId}`, {
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    })

    return response.data.result as CloudflareVideo
  } catch (error) {
    console.error('Error fetching video details:', error)
    throw new Error('Failed to fetch video details')
  }
}

/**
 * Delete video
 */
export async function deleteVideo(videoId: string) {
  try {
    await axios.delete(`${API_BASE}/${videoId}`, {
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    })

    return true
  } catch (error) {
    console.error('Error deleting video:', error)
    throw new Error('Failed to delete video')
  }
}

/**
 * Update video metadata
 */
export async function updateVideoMetadata(
  videoId: string,
  metadata: Record<string, any>
) {
  try {
    const response = await axios.post(
      `${API_BASE}/${videoId}`,
      {
        meta: metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.result as CloudflareVideo
  } catch (error) {
    console.error('Error updating video metadata:', error)
    throw new Error('Failed to update video metadata')
  }
}

/**
 * Generate signed URL for video playback
 * (Only needed if requireSignedURLs is true)
 */
export async function generateSignedUrl(videoId: string, expiresIn: number = 3600) {
  try {
    const response = await axios.post(
      `${API_BASE}/${videoId}/token`,
      {
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      },
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.result.token
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate signed URL')
  }
}

/**
 * Get video stream URL
 */
export function getStreamUrl(videoId: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
}

/**
 * Get video thumbnail URL
 */
export function getThumbnailUrl(videoId: string, time?: number): string {
  const timeParam = time ? `?time=${time}s` : ''
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg${timeParam}`
}

/**
 * Get video embed URL
 */
export function getEmbedUrl(videoId: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/iframe`
}
