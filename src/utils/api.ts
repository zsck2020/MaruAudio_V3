import { invoke } from '@tauri-apps/api/core'

// Tauri 命令调用封装

export async function generateAudio(
  text: string,
  audioPrompt: string,
  engine: string,
  params: Record<string, any>
): Promise<string> {
  return await invoke('generate_audio', {
    text,
    audioPrompt,
    engine,
    generationParams: params,
  })
}

export async function processReferenceAudio(
  filePath: string,
  enableVocalSeparation: boolean
): Promise<string> {
  return await invoke('process_reference_audio', {
    filePath,
    enableVocalSeparation,
  })
}

export async function switchEngine(version: string): Promise<void> {
  return await invoke('switch_engine', { version })
}

export async function listFiles(category?: string): Promise<any[]> {
  return await invoke('list_files', { category })
}

export async function deleteFile(path: string): Promise<void> {
  return await invoke('delete_file', { path })
}

export async function login(email: string, password: string): Promise<any> {
  return await invoke('login', { email, password })
}

