const path = require('path');
const sassTrue = require('sass-true');
const glob = require('glob');

const testPath = `tests/**/*.spec.scss`;

describe('Sass', () => {
    const testFiles = glob.sync(path.resolve(process.cwd(), testPath))

    /** Runs each spec file through sass-true, wiring Jest's describe()/it(). */
    testFiles.forEach((sassFile) => sassTrue.runSass(
      { describe, it },
      sassFile
    ))
})