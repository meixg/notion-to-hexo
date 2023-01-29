import path from 'path'
import * as url from 'url'
const u = import.meta.url
const __filename = url.fileURLToPath(u)
const __dirname = path.dirname(__filename)

export const ROOT_PATH = path.resolve()
export const OUTPUT_DIR = path.resolve(__dirname, '../output')