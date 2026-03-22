import { expect, describe, it } from '@jest/globals';
import { getValue } from './dbConnect';

describe('dbConnect', () => {
	it('should get a single value from the database', async () => {
		const result = await getValue('SELECT * FROM user.profileview WHERE id = ?', [26], 'username');
		expect(result).toBe('ToMakPo');
	});

	it('should return null if no data is found', async () => {
		const result = await getValue('SELECT * FROM user.profileview WHERE id = ?', [999], 'username');
		expect(result).toBeNull();
	});
});