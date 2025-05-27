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
function convertCacheArgs(args: string[], forInstall = false) {
  return args.map(item => {
    switch (item) {
      case '--save-dev':
      case '-D':
        return forInstall ? '--dev' : ''
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
        // Keep --global flag for install command
        return forInstall ? '--global' : ''
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
        args = convertCacheArgs(args, true) // Pass true to preserve --dev flag

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
        // Replace package names with npm: prefixed versions
        args = args.map(arg => {
          if (packagesToUninstall.includes(arg)) {
            return `npm:${arg}`
          }
          return arg
        })

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
          converted = 'deno run start'
        } else if (scriptName === 'test') {
          converted = 'deno task test'
        } else {
          converted = `deno run ${scriptName}`
        }
      } else {
        converted = 'deno run'
      }
      break

    case 'create':
      // npm create react-app my-app -> deno init --npm react-app my-app
      args.shift(); // Remove 'create'
      if (args.length > 0) {
        converted = 'deno init --npm ' + args.join(' ');
      } else {
        converted = "deno init --npm # Please specify a template";
      }
      break;

    case 'test':
    case 't':
    case 'tst':
      converted = 'deno test'
      break

    case 'init':
      converted = 'deno init'
      break

    case 'exec':
      // npm exec package -> deno run --allow-scripts npm:package
      args.shift()
      if (args.length > 0) {
        const packageName = args[0]
        args[0] = `npm:${packageName}`
        converted = 'deno run -A --allow-scripts ' + args.filter(Boolean).join(' ')
      } else {
        converted = 'deno run -A --allow-scripts'
      }
      break;

    case 'start':
      converted = 'deno run start'
      break

    case 'cache':
      args[0] = 'cache'
      if (args[1] === 'clean') {
        converted = 'deno clean'
      } else {
        converted = 'deno cache'
      }
      break

    case 'update':
    case 'upgrade':
      converted = 'deno upgrade'
      break

    case 'outdated':
      converted = "deno outdated"
      break

    default:
      // For commands that don't map directly, provide a comment with updated docs URL
      converted = `npm ${command}\n# Deno's package management differs from npm, see https://docs.deno.com/runtime/fundamentals/node/#node-to-deno-cheatsheet for more info`
  }

  return converted
}
