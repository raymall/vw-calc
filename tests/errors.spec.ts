const path = require('path');
const sass = require('sass');

const compile = (body) =>
  sass.compileString(`@use "vw-calc" as *;\n${body}`, {
    loadPaths: [path.resolve(process.cwd(), 'src')],
  });

describe('vw-calc() error handling', () => {
  it('rejects more than 3 values', () => {
    expect(() => compile('.test { font-size: vw-calc(8 16 24 32); }'))
      .toThrow(/Maximum of 3 \(three\) values allowed/);
  });

  it('rejects a min value greater than the max value', () => {
    expect(() => compile('.test { font-size: vw-calc(32 16); }'))
      .toThrow(/can't be lower than/);
  });

  it('rejects equal min and max values', () => {
    expect(() => compile('.test { font-size: vw-calc(16 16); }'))
      .toThrow(/cannot be equal to/);
  });

  it('rejects a limit value lower than the max value', () => {
    expect(() => compile('.test { font-size: vw-calc(8 24 16); }'))
      .toThrow(/can't be lower than/);
  });
});
