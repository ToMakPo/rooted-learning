import { generateId } from "../lib/utils"

export const UserRole = {
	ADMIN: 'admin',
	TEACHER: 'teacher',
	STUDENT: 'student',
	PARENT: 'parent'
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export interface UserInit {
	id?: string
	username: string
	firstName: string
	lastName: string
	email: string
	role: UserRole
}

export const cleanUsername = (username: string) => username.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')

class User {
	private _id = null as unknown as string
	private _username = null as unknown as string
	private _firstName = null as unknown as string
	private _lastName = null as unknown as string
	private _email = null as unknown as string
	private _role = null as unknown as UserRole

	protected constructor() {}

	/** The unique identifier of the user. */
	get id() {
		return this._id
	}

	/** The unique username of the user. */
	get username() {
		return this._username
	}

	/** The first name of the user. */
	get firstName() {
		return this._firstName
	}

	/** The last name of the user. */
	get lastName() {
		return this._lastName
	}

	/** The email address of the user. */
	get email() {
		return this._email
	}

	/** The role assigned to the user. */
	get role() {
		return this._role
	}

	/** Creates a new user and adds it to the list of users.
	 * 
	 * @param init The initialization object for the user.
	 * @returns The newly created user.
	 */
	protected static create(_: UserInit): User {
		throw new Error("Cannot create a user directly. Please use the specific user type's create method (e.g., Student.create, Teacher.create, etc.)")
	}

	/** Retrieves a user by their id, username, or email.
	 * 
	 * @param identifier The id, username, or email of the user to retrieve. (case-insensitive)
	 * @param list Optional list of users to search within. If not provided, the default lists of all users will be used.
	 * @return The user with the specified id, username, or email, or null if not found.
	 */
	protected static get(identifier: string, list: User[]): User | null {
		identifier = identifier.trim().toLowerCase()
		const cleaned = cleanUsername(identifier)
		return list.find(u => u.id.toLowerCase() === identifier)
			?? list.find(u => cleanUsername(u.username) === cleaned)
			?? list.find(u => u.email.toLowerCase() === identifier)
			?? null
	}
}

export default User