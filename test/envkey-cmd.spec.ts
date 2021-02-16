import * as sinon from 'sinon'
import { assert } from 'chai'
import * as signalTermLib from '../src/signal-termination'
import * as parseArgsLib from '../src/parse-args'
import * as getEnvVarsLib from '../src/get-env-vars'
import * as expandEnvsLib from '../src/expand-envs'
import * as spawnLib from '../src/spawn'
import * as envKeyCmdLib from '../src/envkey-cmd'

const VALID_ENVKEY = 'wYv78UmHsfEu6jSqMZrU-3w1kwyF35nRYwsAJ-env-staging.envkey.com'
const INVALID_ENVKEY2 = 'Emzt4BE7C23QtsC7gb1zinvalid-3NvfNiG1Boy6XH2o-env-staging.envkey.com'

describe('CLI', (): void => {
  let sandbox: sinon.SinonSandbox
  let parseArgsStub: sinon.SinonStub<any, any>
  let envKeyCmdStub: sinon.SinonStub<any, any>
  let processExitStub: sinon.SinonStub<any, any>
  before((): void => {
    sandbox = sinon.createSandbox()
    parseArgsStub = sandbox.stub(parseArgsLib, 'parseArgs')
    envKeyCmdStub = sandbox.stub(envKeyCmdLib, 'EnvKeyCmd')
    processExitStub = sandbox.stub(process, 'exit')
  })

  after((): void => {
    sandbox.restore()
  })

  afterEach((): void => {
    sandbox.resetHistory()
    sandbox.resetBehavior()
  })

  it('should parse the provided args and execute the EnvCmd', async (): Promise<void> => {
    parseArgsStub.returns({})
    await envKeyCmdLib.CLI(['node', './envkey-cmd', '-v'])
    assert.equal(parseArgsStub.callCount, 1)
    assert.equal(envKeyCmdStub.callCount, 1)
    assert.equal(processExitStub.callCount, 0)
  })

  it('should catch exception if EnvCmd throws an exception', async (): Promise<void> => {
    parseArgsStub.returns({})
    envKeyCmdStub.throwsException('Error')
    await envKeyCmdLib.CLI(['node', './envkey-cmd', '-v'])
    assert.equal(parseArgsStub.callCount, 1)
    assert.equal(envKeyCmdStub.callCount, 1)
    assert.equal(processExitStub.callCount, 1)
    assert.equal(processExitStub.args[0][0], 1)
  })
})

describe('EnvKeyCmd', (): void => {
  let sandbox: sinon.SinonSandbox
  let getEnvVarsStub: sinon.SinonStub<any, any>
  let spawnStub: sinon.SinonStub<any, any>
  let expandEnvsSpy: sinon.SinonSpy<any, any>
  before((): void => {
    sandbox = sinon.createSandbox()
    getEnvVarsStub = sandbox.stub(getEnvVarsLib, 'getEnvVars')
    spawnStub = sandbox.stub(spawnLib, 'spawn')
    spawnStub.returns({
      on: (): void => { /* Fake the on method */ },
      kill: (): void => { /* Fake the kill method */ }
    })
    expandEnvsSpy = sandbox.spy(expandEnvsLib, 'expandEnvs')
    sandbox.stub(signalTermLib.TermSignals.prototype, 'handleTermSignals')
    sandbox.stub(signalTermLib.TermSignals.prototype, 'handleUncaughtExceptions')
  })

  after((): void => {
    sandbox.restore()
  })

  afterEach((): void => {
    sandbox.resetHistory()
  })

  it('should parse the provided args and execute the EnvCmd', async (): Promise<void> => {
    getEnvVarsStub.returns({ BOB: 'test' })
    await envKeyCmdLib.EnvKeyCmd({
      command: 'node',
      commandArgs: ['-v'],
      envKey: VALID_ENVKEY
    })
    assert.equal(getEnvVarsStub.callCount, 1)
    assert.equal(spawnStub.callCount, 1)
  })

  it('should override existing env vars if noOverride option is false/missing',
    async (): Promise<void> => {
      process.env.BOB = 'cool'
      getEnvVarsStub.returns({
        BOB: 'test'
      })
      await envKeyCmdLib.EnvKeyCmd({
        command: 'node',
        commandArgs: ['-v'],
        envKey: VALID_ENVKEY
      })
      assert.equal(getEnvVarsStub.callCount, 1)
      assert.equal(spawnStub.callCount, 1)
      assert.equal(spawnStub.args[0][2].env.BOB, 'test')
    }
  )

  it('should not override existing env vars if noOverride option is true',
    async (): Promise<void> => {
      process.env.BOB = 'cool'
      process.env.ENVKEY = VALID_ENVKEY
      getEnvVarsStub.returns({ BOB: 'test' })
      await envKeyCmdLib.EnvKeyCmd({
        command: 'node',
        commandArgs: ['-v'],
        envKey: undefined as unknown as string,
        options: {
          noOverride: true
        }
      })
      assert.equal(getEnvVarsStub.callCount, 1)
      assert.equal(spawnStub.callCount, 1)
      assert.equal(spawnStub.args[0][2].env.BOB, 'cool')
      assert.equal(spawnStub.args[0][2].env.ENVKEY, undefined)
    }
  )

  it('should spawn process with shell option if useShell option is true',
    async (): Promise<void> => {
      process.env.BOB = 'cool'
      getEnvVarsStub.returns({ BOB: 'test' })
      await envKeyCmdLib.EnvKeyCmd({
        command: 'node',
        commandArgs: ['-v'],
        envKey: VALID_ENVKEY,
        options: {
          useShell: true
        }
      })
      assert.equal(getEnvVarsStub.callCount, 1)
      assert.equal(spawnStub.callCount, 1)
      assert.equal(spawnStub.args[0][2].shell, true)
    }
  )

  it('should spawn process with command and args expanded if expandEnvs option is true',
    async (): Promise<void> => {
      getEnvVarsStub.returns({ PING: 'PONG', CMD: 'node' })
      await envKeyCmdLib.EnvKeyCmd({
        command: '$CMD',
        commandArgs: ['$PING', '\\$IP'],
        envKey: VALID_ENVKEY,
        options: {
          expandEnvs: true
        }
      })

      const spawnArgs = spawnStub.args[0]

      assert.equal(getEnvVarsStub.callCount, 1, 'getEnvVars must be called once')
      assert.equal(spawnStub.callCount, 1)
      assert.equal(expandEnvsSpy.callCount, 3, 'command + number of args')
      assert.equal(spawnArgs[0], 'node')
      assert.sameOrderedMembers(spawnArgs[1], ['PONG', '\\$IP'])
      assert.equal(spawnArgs[2].env.PING, 'PONG')
    }
  )

  it('should ignore errors if silent flag provided',
    async (): Promise<void> => {
      delete process.env.BOB
      getEnvVarsStub.throws('MissingFile')
      await envKeyCmdLib.EnvKeyCmd({
        command: 'node',
        commandArgs: ['-v'],
        envKey: INVALID_ENVKEY2,
        options: {
          silent: true
        }
      })
      assert.equal(getEnvVarsStub.callCount, 1)
      assert.equal(spawnStub.callCount, 1)
      assert.isUndefined(spawnStub.args[0][2].env.BOB)
    }
  )
})
