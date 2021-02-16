export interface GetEnvVarOptions {
  envKey: string
  permitted?: string[]
  verbose?: boolean
}

export interface EnvCmdOptions extends GetEnvVarOptions {
  command: string
  commandArgs: string[]
  options?: {
    expandEnvs?: boolean
    noOverride?: boolean
    silent?: boolean
    useShell?: boolean
    verbose?: boolean
  }
}
