import * as sinon from 'sinon'
import { assert } from 'chai'
import { getEnvVars } from '../src/get-env-vars'

const VALID_ENVKEY = 'wYv78UmHsfEu6jSqMZrU-3w1kwyF35nRYwsAJ-env-staging.envkey.com'
const INVALID_ENVKEY = 'INVALID_KEY'

describe('getEnvVars', (): void => {
  let logInfoStub: sinon.SinonStub<any, any>

  before((): void => {
  })

  after((): void => {
    sinon.restore()
  })

  afterEach((): void => {
    sinon.resetHistory()
    sinon.resetBehavior()
    if (logInfoStub !== undefined) {
      logInfoStub.restore()
    }
  })

  it('should fetch a valid environment key',
    async (): Promise<void> => {
      const envs = await getEnvVars({ envKey: VALID_ENVKEY })
      assert.isOk(envs)
      assert.lengthOf(Object.keys(envs), 7)
      assert.equal(envs.TEST, 'it')
      assert.equal(envs.TEST_2, 'works!')
    }
  )

  it('should fail to find an invalid environment Key', async (): Promise<void> => {
    try {
      await getEnvVars({ envKey: INVALID_ENVKEY })
      assert.fail('should not get here.')
    } catch (e) {
      assert.match(e, /ENVKEY invalid/gi)
    }
  })
})
