import { parse } from './command'

/**
 * Converts npm commands to Deno equivalents.
 *
 * Note that Deno's package handling is quite different from npm:
 * - Deno uses direct URLs or npm specifiers instead of a package.json
 * - Packages are cached globally but imported directly in code
 * - No separate install/uninstall concept; imports are fetched on demand
 *
 * Examples:
 * npm install express → deno cache npm:express
 * npm run test → deno test
 * npm run start → deno run main.ts
 * npx cowsay hello → deno run --allow-all npm:cowsay hello
 */
function convertCacheArgs(args: string[]) {
  return args.map(item => {
    switch (item) {
      case '--save-dev':
      case '-D':
      case '--save-prod':
      case '-P':
      case '--save-optional':
      case '-O':
      case '--save-exact':
      case '-E':
      case '--save':
      case '-S':
        return ''
      case '--no-package-lock':
        return ''
      case '--global':
      case '-g':
        return ''
      default:
        return item
    }
  })
}

export function npmToDeno(_m: string, command: string): string {
  let args = parse((command || '').trim())

  const index = args.findIndex(a => a === '--')
  if (index >= 0) {
    args.splice(index, 1)
  }

  let converted: string

  switch (args[0]) {
    case 'install':
    case 'i':
      if (args.length === 1) {
        // npm install -> deno cache npm:
        converted = 'deno cache --reload npm:'
      } else {
        // npm install package -> deno cache npm:package
        args[0] = 'cache'
        args = convertCacheArgs(args)

        // Get package names (without flags)
        const packages = args.filter((arg, index) => index > 0 && !arg.startsWith('-'))
        if (packages.length > 0) {
          // Replace package names with npm: prefixed versions
          args = args.map(arg => {
            if (packages.includes(arg)) {
              return `npm:${arg}`
            }
            return arg
          })
        }

        converted = 'deno ' + args.filter(Boolean).join(' ')
      }
      break

    case 'uninstall':
    case 'un':
    case 'remove':
    case 'r':
    case 'rm':
      converted = "# Deno doesn't have package uninstall, remove imports from your code instead"
      break

    case 'run':
    case 'run-script':
      if (args.length > 1) {
        const scriptName = args[1]
        if (scriptName === 'start') {
          converted = 'deno run main.ts'
        } else if (scriptName === 'test') {
          converted = 'deno test'
        } else {
          converted = `deno task ${scriptName}`
        }
      } else {
        converted = 'deno task'
      }
      break

    case 'test':
    case 't':
    case 'tst':
      converted = 'deno test'
      break

    case 'init':
      converted = 'deno init'
      break

    case 'exec':
      // npm exec package -> deno run --allow-all npm:package
      args.shift()
      if (args.length > 0) {
        const packageName = args[0]
        args[0] = `npm:${packageName}`
        converted = 'deno run --allow-all ' + args.filter(Boolean).join(' ')
      } else {
        converted = 'deno run --allow-all'
      }
      break

    case 'start':
      converted = 'deno run main.ts'
      break

    case 'cache':
      args[0] = 'cache'
      if (args[1] === 'clean') {
        converted = 'deno cache --reload'
      } else {
        converted = 'deno cache'
      }
      break

    default:
      // For commands that don't map directly, provide a comment
      converted = `npm ${command}\n# Deno's package management differs from npm, see https://deno.land/manual@v1.36.1/node/npm_specifiers for more info`
  }

  return converted
}
