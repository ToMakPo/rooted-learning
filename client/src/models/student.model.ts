import User, { UserRole, type UserInit } from "./user.model"
import Parent from "./parent.model"
import Teacher from "./teacher.model"
import Subject from "./subject.model"
import Assignment from "./assignment.model"

export interface StudentInit extends UserInit {
	role: typeof UserRole.STUDENT
	parents: (string | Parent)[]
	teachers?: (string | Teacher)[]
	subjects: (string | Subject)[]
	assignments: (string | Assignment)[]
}

class Student extends User {
	private _parents: Parent[] = []
	private _teachers: Teacher[] = []
	private _subjects: Subject[] = []
	private _assignments: Assignment[] = []

	private static list: Student[] = []

	private constructor() { super() }

	/** The parents of the student. */
	get parents() {
		return [...this._parents]
	}

	addParent(parent: string | Parent) {
		if (typeof parent === 'string') {
			const p = Parent.get(parent)
			if (!p) {
				throw new Error(`Parent with identifier "${parent}" not found.`)
			}
			parent = p
		}

		if (!(parent instanceof Parent)) {
			throw new Error('The provided parent is not a valid Parent instance.')
		}

		if (this._parents.some(p => p.id === parent.id)) {
			throw new Error(`Parent with id "${parent.id}" is already associated with this student.`)
		}

		this._parents.push(parent)
	}

	getParent(identifier: string): Parent | null {
		return Parent.get(identifier, this._parents)
	}

	removeParent(identifier: string) {
		const parent = this.getParent(identifier)
		if (!parent) {
			throw new Error(`Parent with identifier "${identifier}" not found among this student's parents.`)
		}
		this._parents = this._parents.filter(p => p.id !== parent!.id)
	}

	/** The teachers of the student. */
	get teachers() {
		return [...this._teachers]
	}

	addTeacher(teacher: string | Teacher) {
		if (typeof teacher === 'string') {
			const t = Teacher.get(teacher)
			if (!t) {
				throw new Error(`Teacher with identifier "${teacher}" not found.`)
			}
			teacher = t
		}

		if (!(teacher instanceof Teacher)) {
			throw new Error('The provided teacher is not a valid Teacher instance.')
		}

		if (this._teachers.some(t => t.id === teacher.id)) {
			throw new Error(`Teacher with id "${teacher.id}" is already associated with this student.`)
		}

		this._teachers.push(teacher)
	}

	getTeacher(identifier: string): Teacher | null {
		return Teacher.get(identifier, this._teachers)
	}

	removeTeacher(identifier: string) {
		const teacher = this.getTeacher(identifier)
		if (!teacher) {
			throw new Error(`Teacher with identifier "${identifier}" not found among this student's teachers.`)
		}
		this._teachers = this._teachers.filter(t => t.id !== teacher!.id)
	}

	/** The subjects the student is enrolled in. */
	get subjects() {
		return [...this._subjects]
	}

	async addSubject(subject: string | Subject) {
		if (typeof subject === 'string') {
			const s = await Subject.find(subject)
			if (!s) {
				throw new Error(`Subject with identifier "${subject}" not found.`)
			}
			subject = s
		}

		if (!(subject instanceof Subject)) {
			throw new Error('The provided subject is not a valid Subject instance.')
		}

		if (this._subjects.some(s => s.id === subject.id)) {
			throw new Error(`Subject with id "${subject.id}" is already associated with this student.`)
		}

		this._subjects.push(subject)
	}

	async getSubject(identifier: string): Promise<Subject | null> {
		return await Subject.find(identifier, this._subjects)
	}

	async removeSubject(identifier: string) {
		const subject = await this.getSubject(identifier)
		if (!subject) {
			throw new Error(`Subject with identifier "${identifier}" not found among this student's subjects.`)
		}
		this._subjects = this._subjects.filter(s => s.id !== subject.id)
	}

	/** The assignments assigned to the student. */
	get assignments() {
		return [...this._assignments]
	}

	/** Creates a new student user and adds it to the list of students.
	 * 
	 * @param init The initialization object for the student user.
	 * @return The newly created student user.
	 */
	static create(init: StudentInit): Student {
		const student = new Student()
		this.list.push(student)
		return student
	}

	/** Retrieves a student user by their id, username, or email.
	 * 
	 * @param identifier The id, username, or email of the student user to retrieve. (case-insensitive)
	 * @param list Optional list of students to search within. If not provided, the default list of all students will be used.
	 * @returns The student user with the specified identifier, or null if not found.
	 */
	static get(identifier: string, list?: User[]): Student | null {
		return User.get(identifier, list ?? this.list) as Student | null
	}
}

export default Student