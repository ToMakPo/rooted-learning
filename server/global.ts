//////////////////////////////////////
/// GLOBAL FUNCTIONS AND VARIABLES ///
//////////////////////////////////////
// Purpose: Contains global functions and variables that are used throughout the server.

/** Parse any value to a number. 
 * 
 * This will return the number if it is a number, otherwise it will return null.
 * 
 * @param {any} value - The value to parse.
 * @param {number} precisions - The number of decimal places to round to. [optional]
 * 
 * @returns {number | null} The number or null.
 */
export function parseNumber(value: any, precisions?: number) : number | null {
	const getPrecisions = (value: number | null) => {
		if (value == null) return null
		if (precisions == null || isNaN(precisions) || precisions < 0) return value
		return parseFloat(value.toFixed(precisions))
	}

	// if the value is a number, return the number
	if (typeof value === 'number' && !isNaN(value)) {
		return getPrecisions(value)
	}

	// if the value is a string, parse the string to a number
	if (typeof value === 'string') {
		const tempStr = '@##@'

		let check = value
			.replace(/0x[0-9a-f]+/ig, (match) => parseInt(match.substring(2), 16).toString()) // replace hexadecimal numbers with decimal numbers
			.replace(/0o[0-7]+/g, (match) => parseInt(match.substring(2), 8).toString())	  // replace octal numbers with decimal numbers
			.replace(/0b[01]+/g, (match) => parseInt(match.substring(2), 2).toString())		  // replace binary numbers with decimal numbers
			.replace(/[^0-9\.\%\-]/g, '')	// remove all non-numeric characters except for decimal points and percentage symbols
			.replace(/\./, tempStr)      	// replace the first decimal point with a placeholder
			.replace(/\./g, '')         	// remove all decimal points
			.replace(tempStr, '.')       	// replace the placeholder with a decimal point
			.replace(/%(?!$)/, '')			// remove percentage symbols that are not at the end of the string
			.replace(/^\-/, tempStr)		// replace the first negative sign with a placeholder
			.replace(/\-/, '')				// remove all negative signs
			.replace(tempStr, '-')			// replace the placeholder with a negative sign
			.replace(/^\-?\.?\%?$/, '')		// if the value is just a combination of a negative sign, decimal point, and percentage symbol, remove them
		
		// if the value ends with a percentage symbol, divide the value by 100
		if (value.endsWith('%')) {
			check = check.slice(0, -1)	// remove the percentage symbol
			check = check == '' ? '' : String(parseFloat(check) / 100)
		}
		
		return check == '' ? null : getPrecisions(parseFloat(check))
	}

	// if the value is a boolean, return 1 for true and 0 for false
	if (typeof value === 'boolean')
		return value ? 1 : 0

	// if the value is not a number, return null
	if (isNaN(value)) 
		return null

	return null
}

/** Check if a value is a number. 
 * 
 * This will return true if the value is a number, otherwise it will return false.
 * 
 * @param {any} value - The value to check.
 * 
 * @returns {boolean} True if the value is a number, otherwise false.
 */
export function isNumber(value: any) {
	return parseNumber(value) !== null
}

/** Convert a string value to an SQL query value.
 * 
 * @param column string - The column to search.
 * @param value string - The value to convert.
 * 
 * @returns string - The converted value.
 * 
 * @note Fuzzy search is case-insensitive and looks for the filter value as a substring of the group value.
 * - Use '%' as a wildcard.
 * - Use '_' as a single character wildcard.
 * - Use '^' at the beginning of the value to match exact values including case.
 * - Use '\' to escape special characters.
 */
export function fixFuzzySearch(column: string, value: string | null) : [string, string | null] {
	if (value === null) return [`${column} IS NULL`, null]

	if (value.startsWith('^')) {
		return [`BINARY ${column} = ?`, value.substring(1)]
	}

	if (!value.startsWith('%')) value = `%${value}`
	if (!value.endsWith('%')) value = `${value}%`

	return [`${column} LIKE ?`, value]
}

/** Format query.
 * 
 * @param query { [key: string]: (string | ParsedQs | string[] | ParsedQs[] | undefined) } - The query to format.
 * 
 * @returns { [key: string]: any } - The formatted query.
 */
export function formatQuery(query: { [key: string]: any }) : { [key: string]: any } {
	const formatted = {} as { [key: string]: any }

	for (let [key, value] of Object.entries(query)) {
		if (value === 'undefined') formatted[key] = undefined
		else
		if (value === 'null') formatted[key] = null
		else {
			value = value.replace(/\\,/g, '|*comma*|').split(',')
				.map((str: string) => stringToAny(str.trim().replace(/|\*comma\*|/g, ',')))
			
			if (value.length == 1) value = value[0]

			formatted[key] = value
		}
	}

	return formatted
}

/** Convert a string to any type.
 * 
 * @param value { string } - The value to convert.
 * 
 * @returns { any } - The converted value.
 */
export function stringToAny(value: string) {
	if (value === 'undefined') return undefined
	else try { return JSON.parse(value) } catch { return value }
}

/** Convert the string to an object key.
* 
* @param {string} str  - The string to convert.
* @param separator string | null - A string used to separate one word from the next. If null, the words are 
* 	converted to camel case. Default is null.
*/
export function formatKey(str: string, separator: string | null = null) : string {
    separator = separator ?? ''

    const parts = str
        .trim()
        .replace(/ *- */g, '- ')
        .replace(/ *_ */g, '_ ')
        .replace(/ +/g, ' ')
        .replace(/[^0-9a-zA-Z\-\_ ]/g, '')
        .toLowerCase()
        .split(' ')

    if (separator == '') {
        for (let i = 1; i < parts.length; i++) {
            parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1)
        }
        
		return parts
			.join(separator)
			.replace('-' + separator, '-')
			.replace('_' + separator, '_')
	} else {
		return parts.join(separator)
	}
}

////////////////////////////////////////
///             RESPONSE             ///
////////////////////////////////////////

export interface ApiResponse<T = any> {
	/** The sender of the response. */
	sender: string
	/** The status code of the response.
	 * 
	 * 100-199: Informational
	 * 200-299: Success
	 * 300-399: Redirection
	 * 400-499: Client Error
	 * 500-599: Server Error
	 */
	code: number
	/** Whether the request was successful. */
	success: boolean
	/** A message describing the response. */
	message: string
	/** The value of the response.*/
	value?: T
	/** Any additional data to include in the response. */
	data?: any | null
}

/** Create an API response object.
 * 
 * @param sender The sender of the response.
 * @param code The status code of the response.
 * @param success Whether the request was successful.
 * @param message A message describing the response.
 * @param value The value of the response. [optional]
 * @param data Any additional data to include in the response. [optional]
 * @returns An API response object.
 */
export const apiResponse = <T = any>(sender: string, code: number, success: boolean, message: string, value?: T, data?: any | null): ApiResponse<T> => {
	return { sender, code, success, message, value, data }
}