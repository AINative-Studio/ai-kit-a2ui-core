/**
 * Package extension for Chrome Web Store submission
 */

import { createWriteStream, createReadStream } from 'fs'
import { readdir, stat } from 'fs/promises'
import { pipeline } from 'stream/promises'
import { createGzip } from 'zlib'
import { join, relative } from 'path'
import archiver from 'archiver'

const DIST_DIR = 'dist'
const OUTPUT_FILE = 'a2ui-inspector.zip'

async function packageExtension() {
  console.log('Packaging A2UI Inspector extension...')

  const output = createWriteStream(OUTPUT_FILE)
  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  output.on('close', () => {
    console.log(`✓ Extension packaged: ${OUTPUT_FILE}`)
    console.log(`  Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
    console.log('\nReady for Chrome Web Store submission!')
  })

  archive.on('error', (err) => {
    throw err
  })

  archive.pipe(output)

  // Add dist directory contents
  archive.directory(DIST_DIR, false)

  await archive.finalize()
}

packageExtension().catch(console.error)
