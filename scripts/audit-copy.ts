#!/usr/bin/env tsx

import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { findCopyViolations } from './copy-audit-core'

const excludedDirectories = new Set([
  '.git',
  '.next',
  'node_modules',
  'migrations',
  'scripts',
  'tests',
  'ui',
])

function collectTsxFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return []
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return collectTsxFiles(path)
    return entry.isFile() && extname(entry.name) === '.tsx' ? [path] : []
  })
}

const targetFiles = [join('lib', 'i18n', 'vi.ts'), ...collectTsxFiles('.')]
const violations = targetFiles.flatMap((file) =>
  findCopyViolations(readFileSync(file, 'utf8')).map(
    (violation) => `${relative('.', file)}:${violation.line}: /${violation.pattern}/`,
  ),
)

if (violations.length > 0) {
  console.error(`Copy audit failed with ${violations.length} violation(s):`)
  for (const violation of violations) console.error(`  ${violation}`)
  process.exitCode = 1
} else {
  console.log(`Copy audit passed for ${targetFiles.length} user-facing source file(s).`)
}
