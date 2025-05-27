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
 * npm install express → deno install npm:express
 * npm run test → deno test
 * npm run start → deno run start
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
        // npm install -> deno install
        converted = 'deno install'
      } else {
        // npm install package -> deno install npm:package
        args[0] = 'install'
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
      args[0] = 'uninstall'
      args = convertCacheArgs(args)

      // Get package names (without flags)
      const packagesToUninstall = args.filter((arg, index) => index > 0 && !arg.startsWith('-'))

      if (packagesToUninstall.length > 0) {
        converted = 'deno ' + args.filter(Boolean).join(' ')
      } else {
        converted = "deno uninstall # Please specify packages to uninstall"
      }
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
      // npm exec package -> deno run npm:package
      args.shift()
      if (args.length > 0) {
        const packageName = args[0]
        args[0] = `npm:${packageName}`
        // Modern Deno versions have improved permissions and don't always need --allow-all
        converted = 'deno run ' + args.filter(Boolean).join(' ')
      } else {
        converted = 'deno run'
      }
      break

    case 'start':
      // Deno now uses deno task start as the recommended approach
      converted = 'deno task start'
      break

    case 'cache':
      args[0] = 'cache'
      if (args[1] === 'clean') {
        // Newer Deno versions support explicit cache management
        converted = 'deno cache --reload'
      } else {
        converted = 'deno cache'
      }
      break

    case 'update':
    case 'upgrade':
      // Modern Deno uses 'deno upgrade' for self-updating
      converted = 'deno upgrade'
      break

    case 'outdated':
      // Deno doesn't have a direct equivalent for outdated packages
      converted = "# Deno doesn't have a direct 'outdated' command, consider checking JSR or npm registry manually"
      break

    default:
      // For commands that don't map directly, provide a comment with updated docs URL
      converted = `npm ${command}\n# Deno's package management differs from npm, see https://docs.deno.com/runtime/manual/node/npm_specifiers for more info`
  }

  return converted
}
