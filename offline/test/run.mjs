// Test runner. No framework — four files, each printing ok/FAIL lines and
// exiting non-zero on failure.
//
// The database test has to run under Electron's node (ELECTRON_RUN_AS_NODE),
// because better-sqlite3 is built against Electron's ABI. The rest are plain
// node.
import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const suites = [
  { file: 'bags.test.mjs', runner: 'node' },
  { file: 'receipt.test.mjs', runner: 'node' },
  { file: 'kitchen.test.cjs', runner: 'node' },
  { file: 'db.test.cjs', runner: 'electron' },
]

let failed = 0
for (const { file, runner } of suites) {
  console.log(`\n━━━ ${file} ━━━`)
  let cmd = process.execPath
  let env = { ...process.env }
  if (runner === 'electron') {
    try {
      cmd = require('electron')
      env.ELECTRON_RUN_AS_NODE = '1'
    } catch (_) {
      console.log('  skipped — electron not installed')
      continue
    }
  }
  const res = spawnSync(cmd, [join(here, file)], { stdio: 'inherit', env })
  if (res.status !== 0) failed++
}

console.log(failed ? `\n${failed} suite(s) failed` : '\nall suites passed')
process.exit(failed ? 1 : 0)
