import Parent from "../models/parent.model"
import Student from "../models/student.model"
import Teacher from "../models/teacher.model"

/** Converts a string to a key.
 * 
 * @param textInput The string to convert to a key.
 * @returns The converted key.
 */
export function convertToKey(textInput: string): string {
	return textInput.toLowerCase().trim()
		.replace(/(\s|_)+/g, '-')		// Replace spaces and underscores with hyphens
		.replace(/-+/g, '-')			// Replace multiple hyphens with a single hyphen
		.replace(/[^a-z0-9\-]/g, '')	// Remove all non-alphanumeric characters except hyphens
		.replace(/(^-|-$)/g, '')		// Remove leading and trailing hyphens
}

/** Generates a random id string.
 * 
 * @returns A random id string that is 8 characters long and contains only letters and numbers.
 */
export function generateId(): string {
	return Math.random().toString(36).substring(2, 10).toUpperCase()
}

/** Cleans an id string.
 * 
 * Removes leading and trailing whitespace, converts to uppercase, and removes all non-alphanumeric characters. The resulting string must be 
 * 8 characters long to be considered valid.
 * 
 * @param id The id string to clean.
 * @returns The cleaned id string, or null if the id is invalid.
 */
export function cleanId(id: string): string | null {
	const cleanedId = id.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '')
	if (cleanedId.length !== 8) return null
	return cleanedId
}

/** Finds a user by their identifier.
 * 
 * The identifier can be a string (which will be used to search for a matching user) or an instance of Student, Teacher, or Parent (which 
 * will be returned as is).
 * 
 * @param ref The identifier or instance of the user.
 * @returns The found user instance.
 */
export function findUser(ref: string | Student | Teacher | Parent): Student | Teacher | Parent {
	if (typeof ref === 'string') {
		const parent = Parent.get(ref)
		if (parent) return parent
		const teacher = Teacher.get(ref)
		if (teacher) return teacher
		const student = Student.get(ref)
		if (student) return student
		throw new Error(`User with identifier "${ref}" not found.`)
	}

	return ref
}

export type ValidationResults<R = string> = Promise<{
	/** The sender of the validation request. */
	sender: string
	/** The validation code.
	 * 
	 * - 100s are for successful validations
	 * - 500s are for failed validations
	 */
	code: number
	/** Whether the input results in a valid value. */
	valid: boolean
	/** A message describing the validation results. */
	message: string
	/** The cleaned and validated value, or null if the input is invalid. */
	value: R
}>

export type setValueResults<R = string> = Promise<{
	/** The sender of the set value request. */
	sender: string
	/** The validation code.
	 * 
	 * - 100s are for successful validations
	 * - 500s are for failed validations
	 */
	code: number
	/** Whether the input results in a valid value. */
	valid: boolean
	/** A message describing the validation results. */
	message: string
	/** The cleaned and validated value, or null if the input is invalid. */
	value: R
	/** Additional data related to the set value request. */
	data: null | Record<string, any>
}>

/** Cleans class names by filtering out falsy values and joining the remaining class names with a space.
 * 
 * This is useful for conditionally applying CSS classes in React components.
 * 
 * @param classes An array of class names, where falsy values (false, null, undefined) will be ignored.
 * @returns A string of class names separated by a space, with falsy values removed.
 */
export function cleanClassName(...classes: (string | false | null | undefined)[]): string {
	return classes.filter(c => !!c).join(' ')
}