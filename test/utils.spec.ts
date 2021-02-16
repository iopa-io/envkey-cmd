import { assert } from 'chai'
import { parseArgList } from '../src/utils'

describe('utils', (): void => {
  describe('parseArgList', (): void => {
    it('should parse a cli arg list', (): void => {
      const res = parseArgList('thanks,for,all,the,fish')
      assert.lengthOf(res, 5)
      assert.includeOrderedMembers(res, ['thanks', 'for', 'all', 'the', 'fish'])
    })
  })
})
