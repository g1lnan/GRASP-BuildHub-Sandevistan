import { UnsupportedAudioError } from '@/lib/services/errors'
import { baseAudioMimeType } from './types'

type Vint = { readonly value: number; readonly width: number; readonly unknown: boolean }

function readVint(buffer: Buffer, offset: number, preserveMarker: boolean): Vint | null {
  const first = buffer[offset]
  if (first === undefined || first === 0) return null
  let marker = 0x80
  let width = 1
  while (width <= 8 && (first & marker) === 0) {
    marker >>= 1
    width += 1
  }
  if (width > 8 || offset + width > buffer.length) return null

  const firstPayload = first & (marker - 1)
  let value = preserveMarker ? first : firstPayload
  let unknown = !preserveMarker && firstPayload === marker - 1
  for (let index = 1; index < width; index += 1) {
    const byte = buffer[offset + index] ?? 0
    value = value * 256 + byte
    unknown &&= byte === 0xff
  }
  return { value, width, unknown }
}

function readUnsigned(buffer: Buffer, start: number, length: number): number {
  let value = 0
  for (let index = 0; index < length; index += 1) {
    value = value * 256 + (buffer[start + index] ?? 0)
  }
  return value
}

function findBytes(buffer: Buffer, bytes: readonly number[], from = 0): number {
  return buffer.indexOf(Buffer.from(bytes), from)
}

function webmScalar(buffer: Buffer, id: readonly number[]): { value: number; end: number } | null {
  const idOffset = findBytes(buffer, id)
  if (idOffset < 0) return null
  const size = readVint(buffer, idOffset + id.length, false)
  if (size === null || size.value < 1 || size.value > 8) return null
  const start = idOffset + id.length + size.width
  const end = start + size.value
  if (end > buffer.length) return null

  if (id[0] === 0x44 && id[1] === 0x89) {
    if (size.value === 4) return { value: buffer.readFloatBE(start), end }
    if (size.value === 8) return { value: buffer.readDoubleBE(start), end }
    return null
  }
  return { value: readUnsigned(buffer, start, size.value), end }
}

function webmClusterDurationTicks(buffer: Buffer): number {
  const clusterId = [0x1f, 0x43, 0xb6, 0x75] as const
  let searchOffset = 0
  let maximumTicks = 0

  while (searchOffset < buffer.length) {
    const clusterOffset = findBytes(buffer, clusterId, searchOffset)
    if (clusterOffset < 0) break
    const clusterSize = readVint(buffer, clusterOffset + clusterId.length, false)
    if (clusterSize === null) break
    let offset = clusterOffset + clusterId.length + clusterSize.width
    const nextClusterOffset = findBytes(buffer, clusterId, offset)
    const declaredEnd = clusterSize.unknown ? buffer.length : offset + clusterSize.value
    const clusterEnd =
      !clusterSize.unknown || nextClusterOffset < 0
        ? Math.min(buffer.length, declaredEnd)
        : Math.min(buffer.length, declaredEnd, nextClusterOffset)
    let clusterTimecode = 0

    while (offset < clusterEnd) {
      const id = readVint(buffer, offset, true)
      if (id === null) break
      const size = readVint(buffer, offset + id.width, false)
      if (size === null) break
      const dataStart = offset + id.width + size.width
      const dataEnd = dataStart + size.value
      if (dataEnd > clusterEnd) break

      if (id.value === 0xe7) {
        clusterTimecode = readUnsigned(buffer, dataStart, size.value)
      } else if (id.value === 0xa3) {
        const track = readVint(buffer, dataStart, false)
        const timecodeOffset = track === null ? dataEnd : dataStart + track.width
        if (timecodeOffset + 2 <= dataEnd) {
          const relativeTimecode = buffer.readInt16BE(timecodeOffset)
          maximumTicks = Math.max(maximumTicks, clusterTimecode + relativeTimecode)
        }
      }
      offset = dataEnd
    }
    searchOffset = Math.max(clusterEnd, clusterOffset + clusterId.length)
  }
  return maximumTicks
}

function webmDurationSeconds(buffer: Buffer): number | null {
  const timecodeScale = webmScalar(buffer, [0x2a, 0xd7, 0xb1])?.value ?? 1_000_000
  const declaredTicks = webmScalar(buffer, [0x44, 0x89])?.value ?? 0
  const observedTicks = webmClusterDurationTicks(buffer)
  const ticks = Math.max(declaredTicks, observedTicks)
  return ticks > 0 ? (ticks * timecodeScale) / 1_000_000_000 : null
}

function wavDurationSeconds(buffer: Buffer): number | null {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null
  }
  let offset = 12
  let byteRate = 0
  let dataBytes = 0
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    if (id === 'fmt ' && size >= 12 && dataStart + size <= buffer.length) {
      byteRate = buffer.readUInt32LE(dataStart + 8)
    }
    if (id === 'data') dataBytes += Math.min(size, Math.max(0, buffer.length - dataStart))
    offset = dataStart + size + (size % 2)
  }
  return byteRate > 0 && dataBytes > 0 ? dataBytes / byteRate : null
}

function mp4DurationSeconds(buffer: Buffer): number | null {
  let bestDuration = 0

  function walk(start: number, end: number) {
    let offset = start
    while (offset + 8 <= end) {
      let size = buffer.readUInt32BE(offset)
      const type = buffer.toString('ascii', offset + 4, offset + 8)
      let headerSize = 8
      if (size === 1 && offset + 16 <= end) {
        const largeSize = buffer.readBigUInt64BE(offset + 8)
        if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return
        size = Number(largeSize)
        headerSize = 16
      } else if (size === 0) {
        size = end - offset
      }
      if (size < headerSize || offset + size > end) return
      const payloadStart = offset + headerSize

      if ((type === 'mvhd' || type === 'mdhd') && payloadStart + 20 <= offset + size) {
        const version = buffer[payloadStart]
        const timescaleOffset = payloadStart + (version === 1 ? 20 : 12)
        const durationOffset = timescaleOffset + 4
        if (durationOffset + (version === 1 ? 8 : 4) <= offset + size) {
          const timescale = buffer.readUInt32BE(timescaleOffset)
          const duration =
            version === 1
              ? Number(buffer.readBigUInt64BE(durationOffset))
              : buffer.readUInt32BE(durationOffset)
          if (timescale > 0) bestDuration = Math.max(bestDuration, duration / timescale)
        }
      }
      if (['moov', 'trak', 'mdia'].includes(type)) walk(payloadStart, offset + size)
      offset += size
    }
  }

  walk(0, buffer.length)
  return bestDuration > 0 ? bestDuration : null
}

function oggDurationSeconds(buffer: Buffer): number | null {
  if (buffer.length < 36 || buffer.toString('ascii', 0, 4) !== 'OggS') return null
  const firstPageSegments = buffer[26] ?? 0
  if (((buffer[5] ?? 0) & 0x02) === 0) return null
  if (firstPageSegments === 0 || 27 + firstPageSegments > buffer.length) return null
  const firstPacketBytes = buffer[27] ?? 0
  const firstPacketOffset = 27 + firstPageSegments
  if (
    firstPacketBytes < 8 ||
    firstPacketOffset + firstPacketBytes > buffer.length ||
    buffer.toString('ascii', firstPacketOffset, firstPacketOffset + 8) !== 'OpusHead'
  ) {
    return null
  }
  const opusStreamSerial = buffer.readUInt32LE(14)

  let offset = 0
  let maximumGranule = 0n
  while (offset + 27 <= buffer.length) {
    const pageOffset = buffer.indexOf('OggS', offset, 'ascii')
    if (pageOffset < 0 || pageOffset + 27 > buffer.length) break
    const segmentCount = buffer[pageOffset + 26] ?? 0
    if (pageOffset + 27 + segmentCount > buffer.length) break
    let bodySize = 0
    for (let index = 0; index < segmentCount; index += 1) {
      bodySize += buffer[pageOffset + 27 + index] ?? 0
    }
    const granule = buffer.readBigUInt64LE(pageOffset + 6)
    if (buffer.readUInt32LE(pageOffset + 14) === opusStreamSerial) {
      maximumGranule = granule > maximumGranule ? granule : maximumGranule
    }
    offset = pageOffset + 27 + segmentCount + bodySize
  }
  return maximumGranule > 0n ? Number(maximumGranule) / 48_000 : null
}

function flacDurationSeconds(buffer: Buffer): number | null {
  if (buffer.toString('ascii', 0, 4) !== 'fLaC' || buffer.length < 42) return null
  const blockType = (buffer[4] ?? 0) & 0x7f
  const blockLength = readUnsigned(buffer, 5, 3)
  if (blockType !== 0 || blockLength < 34 || buffer.length < 8 + blockLength) return null
  const packed = buffer.readBigUInt64BE(18)
  const sampleRate = Number((packed >> 44n) & 0xfffffn)
  const totalSamples = Number(packed & 0xfffffffffn)
  return sampleRate > 0 && totalSamples > 0 ? totalSamples / sampleRate : null
}

export function audioDurationSeconds(audio: Buffer, mimeType: string): number {
  const baseType = baseAudioMimeType(mimeType)
  const duration =
    baseType === 'audio/webm'
      ? webmDurationSeconds(audio)
      : baseType === 'audio/mp4' || baseType === 'audio/m4a'
        ? mp4DurationSeconds(audio)
        : baseType === 'audio/ogg'
          ? oggDurationSeconds(audio)
          : baseType === 'audio/wav'
            ? wavDurationSeconds(audio)
            : baseType === 'audio/flac'
              ? flacDurationSeconds(audio)
              : null

  if (duration === null || !Number.isFinite(duration) || duration <= 0) {
    throw new UnsupportedAudioError()
  }
  return duration
}
