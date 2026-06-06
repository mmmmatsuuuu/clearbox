export type SaveData = {
  heroX: number
  heroY: number
  heroHp: number
}

export const SaveManager = {
  save(data: SaveData): void {
    const bytes = [data.heroX, data.heroY, data.heroHp]
    const hex = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')

    const blob = new Blob([hex + '\n'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'save_data.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  load(): Promise<SaveData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt'

      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) { resolve(null); return }

        try {
          const text = await file.text()
          const bytes = text.trim().split(/\s+/).map(s => parseInt(s, 16))

          if (bytes.length < 3 || bytes.some(isNaN)) {
            resolve(null)
            return
          }

          resolve({ heroX: bytes[0], heroY: bytes[1], heroHp: bytes[2] })
        } catch {
          resolve(null)
        }
      }

      input.click()
    })
  },
}
