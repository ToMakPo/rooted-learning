type equals = { $eq: string | number | boolean | null }
type greaterThan = { $gt: number }
type lessThan = { $lt: number }
type greaterThanOrEqual = { $gte: number }
type lessThanOrEqual = { $lte: number }
type between = (lessThan | lessThanOrEqual) & (greaterThan | greaterThanOrEqual)
type contains = { $contains: string }
type startsWith = { $startsWith: string }
type endsWith = { $endsWith: string }
type regex = { $regex: string, $options?: string }
type inArray = { $in: (string | number | boolean | null)[] }
type criteria = { [key: string]: string | string[] | number | number[] | boolean | boolean[] | null | equals | greaterThan | lessThan | greaterThanOrEqual | lessThanOrEqual | between | contains | startsWith | endsWith | inArray | regex }
type condition = { $and: filter[] } | { $or: filter[] } | { $not: filter }
type filter = criteria | condition

function isAndCondition(value: filter): value is { $and: filter[] } {
	return '$and' in value && Array.isArray(value.$and)
}

function isOrCondition(value: filter): value is { $or: filter[] } {
	return '$or' in value && Array.isArray(value.$or)
}

function isNotCondition(value: filter): value is { $not: filter } {
	return '$not' in value && typeof value.$not === 'object' && value.$not !== null
}

/** Convert a filter object to an SQL WHERE clause and parameters.
 * 
 * @param {filter} filter - The filter object to convert.
 * @returns {[string, any[]]} A tuple containing the SQL WHERE clause and an array of parameters.
 */
export function filterToSQL(filter: filter) : [string, any[]] {
	if (isAndCondition(filter)) {
		const sqlParts = [] as string[]
		const params = [] as any[]
		for (const subFilter of filter.$and) {
			const [sql, subParams] = filterToSQL(subFilter)
			sqlParts.push(`(${sql})`)
			params.push(...subParams)
		}
		return [sqlParts.join(' AND '), params]
	}

	if (isOrCondition(filter)) {
		const sqlParts = [] as string[]
		const params = [] as any[]
		for (const subFilter of filter.$or) {
			const [sql, subParams] = filterToSQL(subFilter)
			sqlParts.push(`(${sql})`)
			params.push(...subParams)
		}
		return [sqlParts.join(' OR '), params]
	}

	if (isNotCondition(filter)) {
		const [sql, params] = filterToSQL(filter.$not)
		return [`NOT (${sql})`, params]
	}

	const sqlParts = [] as string[]
	const params = [] as any[]

	for (const [key, value] of Object.entries(filter)) {
		if (value === null) {
			sqlParts.push(`${key} IS NULL`)
		} else if (['string', 'number', 'boolean'].includes(typeof value)) {
			sqlParts.push(`${key} = ?`)
			params.push(value)
		} else if (Array.isArray(value)) {
			if (!value.length) {
				console.warn(`Empty array provided for key "${key}" in filter. This will always evaluate to false.`)
				sqlParts.push('FALSE')
				continue
			}

			const valueTypes = new Set(value.map(v => typeof v))
			if (valueTypes.size > 1) {
				console.warn(`Inconsistent types in array for key "${key}" in filter. This will always evaluate to false.`)
				sqlParts.push('FALSE')
				continue
			}
			if (!['string', 'number', 'boolean'].includes([...valueTypes][0])) {
				console.warn(`Unsupported types in array for key "${key}" in filter. This will always evaluate to false.`)
				sqlParts.push('FALSE')
				continue
			}

			sqlParts.push(`${key} IN (${value.map(() => '?').join(', ')})`)
			params.push(...value)
		} else if (typeof value === 'object') {
			if ('$eq' in value) {
				sqlParts.push(`${key} = ?`)
				params.push(value.$eq)
			} else if ('$gt' in value) {
				sqlParts.push(`${key} > ?`)
				params.push(value.$gt)
			} else if ('$lt' in value) {
				sqlParts.push(`${key} < ?`)
				params.push(value.$lt)
			} else if ('$gte' in value) {
				sqlParts.push(`${key} >= ?`)
				params.push(value.$gte)
			} else if ('$lte' in value) {
				sqlParts.push(`${key} <= ?`)
				params.push(value.$lte)
			} else if ('$contains' in value) {
				sqlParts.push(`${key} LIKE ?`)
				params.push(`%${value.$contains}%`)
			} else if ('$startsWith' in value) {
				sqlParts.push(`${key} LIKE ?`)
				params.push(`${value.$startsWith}%`)
			} else if ('$endsWith' in value) {
				sqlParts.push(`${key} LIKE ?`)
				params.push(`%${value.$endsWith}`)
			} else if ('$in' in value) {
				sqlParts.push(`${key} IN (${value.$in.map(() => '?').join(', ')})`)
				params.push(...value.$in)
			} else if ('$regex' in value) {
				sqlParts.push(`${key} REGEXP ?`)
				params.push(value.$regex)
			} else {
				throw new Error(`Invalid filter value for key "${key}": ${JSON.stringify(value)}`)
			}
		} else {
			sqlParts.push(`${key} = ?`)
			params.push(value)
		}
	}

	return [sqlParts.join(' AND '), params]
}

export default filter