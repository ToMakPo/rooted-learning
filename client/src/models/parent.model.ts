import type Student from "./student.model"
import User, { UserRole, type UserInit } from "./user.model"

export interface ParentInit extends UserInit {
	role: typeof UserRole.PARENT
	children?: (string | Student)[]
}

class Parent extends User {
	private constructor() { super() }
	private _children: Student[] = []

	private static list: Parent[] = []

	/** The children of the parent. */
	get children() {
		return [...this._children]
	}

	/** Creates a new parent user and adds it to the list of parents.
	 * 
	 * @param init The initialization object for the parent user.
	 * @return The newly created parent user.
	 */
	static create(init: ParentInit): Parent {
		const parent = new Parent()
		this.list.push(parent)
		return parent
	}

	/** Retrieves a parent user by their id, username, or email.
	 * 
	 * @param identifier The id, username, or email of the parent user to retrieve. (case-insensitive)
	 * @param list Optional list of parents to search within. If not provided, the default list of all parents will be used.
	 * @returns The parent user with the specified identifier, or null if not found.
	 */
	static get(identifier: string, list?: User[]): Parent | null {
		return User.get(identifier, list ?? this.list) as Parent | null
	}
}

export default Parent