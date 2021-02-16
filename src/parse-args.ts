import * as commander from 'commander'
import { EnvCmdOptions } from './types'
import { parseArgList } from './utils'

// Use commonjs require to prevent a weird folder hierarchy in dist
const packageJson = require('../package.json') /* eslint-disable-line */

/**
* Parses the arguments passed into the cli
*/
export function parseArgs (args: string[]): EnvCmdOptions {
  // Run the initial arguments through commander in order to determine
  // which value in the args array is the `command` to execute
  let program = parseArgsUsingCommander(args)
  const command = program.args[0]
  // Grab all arguments after the `command` in the args array
  const commandArgs = args.splice(args.indexOf(command) + 1)

  // Reprocess the args with the command and command arguments removed
  program = parseArgsUsingCommander(args.slice(0, args.indexOf(command)))

  // Set values for provided options
  let noOverride = false
  // In commander `no-` negates the original value `override`
  if (program.override === false) {
    noOverride = true
  }
  let useShell = false
  if (program.useShell === true) {
    useShell = true
  }
  let expandEnvs = false
  if (program.expandEnvs === true) {
    expandEnvs = true
  }
  let verbose = false
  if (program.verbose === true) {
    verbose = true
  }
  let silent = false
  if (program.silent === true) {
    silent = true
  }

  let permitted: any
  if (program.permitted !== undefined && program.permitted.length !== 0) {
    permitted = program.permitted
  }

  let envKey: any
  if (program.envkey !== undefined) {
    envKey = program.envkey
  }

  if ((envKey == null || envKey === undefined) && process.env.ENVKEY !== null && process.env.ENVKEY !== undefined) {
    envKey = process.env.ENVKEY
  }

  const options = {
    command,
    commandArgs,
    envKey,
    permitted,
    options: {
      expandEnvs,
      noOverride,
      silent,
      useShell,
      verbose
    }
  }
  if (verbose) {
    console.info(`Options: ${JSON.stringify(options, null, 0)}`)
  }
  return options
}

export function parseArgsUsingCommander (args: string[]): commander.Command {
  const program = new commander.Command()
  return program
    .version(packageJson.version, '-v, --version')
    .usage('[options] <command> [...args]')
    .option('-e, --envkey [ENVKEY]', 'The ENVKEY to use; defaults to process.env.ENVKEY')
    .option('--permitted [var1, var2, ...]', 'whitelist of permitted vars (useful for client-side config) - defaults to permitting all if omitted', parseArgList)
    .option('--no-override', 'Do not override existing environment variables')
    .option('--silent', 'Ignore any envkey-cmd errors and only fail on executed program failure.')
    .option('--use-shell', 'Execute the command in a new shell with the given environment')
    .option('--verbose', 'Print helpful debugging information')
    .option('-x, --expand-envs', 'Replace $var in args and command with environment variables')
    .allowUnknownOption(true)
    .parse(['_', '_', ...args])
}
