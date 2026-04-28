import { createContext, useContext } from 'react'

export interface AudioAnalyserFrame {
  bins: number[]
  energy: number
}

export const EMPTY_BINS = Array.from({ length: 32 }, () => 0)
export const EMPTY_FRAME: AudioAnalyserFrame = {
  bins: EMPTY_BINS,
  energy: 0,
}

export const AudioAnalyserContext = createContext<AudioAnalyserFrame>(EMPTY_FRAME)

export const useAudioAnalyser = () => useContext(AudioAnalyserContext)

