import convert from '../src/index'

describe('npm to deno commands conversion', () => {
  it('should convert install command', () => {
    expect(convert('npm install', 'deno')).toBe('deno cache --reload npm:')
    expect(convert('npm install express', 'deno')).toBe('deno cache npm:express')
    expect(convert('npm install express react', 'deno')).toBe('deno cache npm:express npm:react')
    expect(convert('npm i lodash --save-dev', 'deno')).toBe('deno cache npm:lodash')
  })

  it('should convert global install command', () => {
    expect(convert('npm install -g express', 'deno')).toBe('deno cache npm:express')
    expect(convert('npm install --global typescript', 'deno')).toBe('deno cache npm:typescript')
  })

  it('should convert uninstall commands with helpful message', () => {
    expect(convert('npm uninstall express', 'deno')).toBe("# Deno doesn't have package uninstall, remove imports from your code instead")
    expect(convert('npm remove lodash', 'deno')).toBe("# Deno doesn't have package uninstall, remove imports from your code instead")
  })

  it('should convert run commands', () => {
    expect(convert('npm run start', 'deno')).toBe('deno run main.ts')
    expect(convert('npm run test', 'deno')).toBe('deno test')
    expect(convert('npm run build', 'deno')).toBe('deno task build')
  })

  it('should convert test commands', () => {
    expect(convert('npm test', 'deno')).toBe('deno test')
    expect(convert('npm t', 'deno')).toBe('deno test')
  })

  it('should convert init command', () => {
    expect(convert('npm init', 'deno')).toBe('deno init')
  })

  it('should convert exec command', () => {
    expect(convert('npm exec cowsay "Hello"', 'deno')).toBe('deno run --allow-all npm:cowsay "Hello"')
    expect(convert('npx cowsay "Hello"', 'deno')).toBe('deno run --allow-all npm:cowsay "Hello"')
  })

  it('should convert cache commands', () => {
    expect(convert('npm cache clean', 'deno')).toBe('deno cache --reload')
  })

  it('should add helpful comments for commands without direct equivalents', () => {
    expect(convert('npm publish', 'deno')).toContain("# Deno's package management differs")
    expect(convert('npm link', 'deno')).toContain("# Deno's package management differs")
  })

  it('should convert executor commands', () => {
    expect(convert('npx create-react-app my-app', 'deno')).toBe('deno run --allow-all npm:create-react-app my-app')
  })
})
