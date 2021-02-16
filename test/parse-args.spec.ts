/* eslint @typescript-eslint/no-non-null-assertion: 0 */
import * as sinon from 'sinon'
import { assert } from 'chai'
import { parseArgs } from '../src/parse-args'

describe('parseArgs', (): void => {
  const command = 'command'
  const commandArgs = ['cmda1', 'cmda2', '--cmda3', '-4', 'cmda4']
  const envkey = 'wYv78UmHsfEu6jSqMZrU-3w1kwyF35nRYwsAJ-env-staging.envkey.com'
  const permitted = ['TEST', 'TEST_9']
  let logInfoStub: sinon.SinonStub<any, any>

  before((): void => {
    logInfoStub = sinon.stub(console, 'info')
  })

  after((): void => {
    sinon.restore()
  })

  afterEach((): void => {
    sinon.resetHistory()
    sinon.resetBehavior()
  })

  it('should parse permitted value', (): void => {
    const res = parseArgs(['--permitted', permitted.join(','), command])
    assert.exists(res.permitted)
    assert.sameOrderedMembers(res.permitted!, permitted)
  })

  it('should parse envkey value', (): void => {
    const res = parseArgs(['-e', envkey, command])
    assert.equal(res.envKey, envkey)
  })

  it('should parse override option', (): void => {
    const res = parseArgs(['-e', envkey, '--no-override', command, ...commandArgs])
    assert.exists(res.options)
    assert.isTrue(res.options!.noOverride)
  })

  it('should parse use shell option', (): void => {
    const res = parseArgs(['-e', envkey, '--use-shell', command, ...commandArgs])
    assert.exists(res.options)
    assert.isTrue(res.options!.useShell)
  })

  it('should print to console.info if --verbose flag is passed', (): void => {
    const res = parseArgs(['-e', envkey, '--verbose', command, ...commandArgs])
    assert.exists(res.options!.verbose)
    assert.equal(logInfoStub.callCount, 1)
  })

  it('should parse expandEnvs option', (): void => {
    const res = parseArgs(['-e', envkey, '-x', command, ...commandArgs])
    assert.exists(res.envKey)
    assert.isTrue(res.options!.expandEnvs)
  })

  it('should parse silent option', (): void => {
    const res = parseArgs(['-e', envkey, '--silent', command, ...commandArgs])
    assert.exists(res.envKey)
    assert.isTrue(res.options!.silent)
  })
})
