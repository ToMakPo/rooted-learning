import User, { UserRole, type UserInit } from "./user.model"

export interface TeacherInit extends UserInit {
	role: typeof UserRole.TEACHER
}

class Teacher extends User {
	private constructor() { super() }

	private static list: Teacher[] = []

	/** Creates a new teacher user and adds it to the list of teachers.
	 * 
	 * @param init The initialization object for the teacher user.
	 * @return The newly created teacher user.
	 */
	static create(init: TeacherInit): Teacher {
		const teacher = new Teacher()
		this.list.push(teacher)
		return teacher
	}

	/** Retrieves a teacher user by their id, username, or email.
	 * 
	 * @param identifier The id, username, or email of the teacher user to retrieve. (case-insensitive)
	 * @param list Optional list of teachers to search within. If not provided, the default list of all teachers will be used.
	 * @returns The teacher user with the specified identifier, or null if not found.
	 */
	static get(identifier: string, list?: User[]): Teacher | null {
		return User.get(identifier, list ?? this.list) as Teacher | null
	}
}

export default Teacher