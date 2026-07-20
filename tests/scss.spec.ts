import path from 'node:path'
import { globSync } from 'glob'
import { runSass } from 'sass-true'

const testPath = 'tests/**/*.spec.scss'

describe('Sass', () => {
  const testFiles = globSync(path.resolve(process.cwd(), testPath))

  /** Runs each spec file through sass-true, wiring Jest's describe()/it(). */
  testFiles.forEach((sassFile) => runSass({ describe, it }, sassFile))
})
