import { convertToKey, findUser, generateId } from "../lib/utils"
import Comment, { type CommentInit } from "./comment.model"
import Parent from "./parent.model"
import Student from "./student.model"
import Subject from "./subject.model"
import Teacher from "./teacher.model"

const AssignmentStatus = {
	NOT_STARTED: 'not-started',
	IN_PROGRESS: 'in-progress',
	PAUSED: 'paused',
	COMPLETED: 'completed'
} as const

type AssignmentStatus = typeof AssignmentStatus[keyof typeof AssignmentStatus]

interface AssignmentInit {
	id?: string
	subject: string | Subject
	assignedBy: string | Parent | Teacher | Student
	name: string
	description: string
	comments?: (CommentInit | Comment)[]
	dueDate?: Date | null
	status?: AssignmentStatus
	startedTimestamp?: Date | null
	completedTimestamp?: Date | null
	duration?: number
}

class Assignment {
	private _id = null as unknown as string
	private _subject = null as unknown as Subject
	private _assignedBy = null as unknown as Parent | Teacher | Student
	private _name = null as unknown as string
	private _description = null as unknown as string
	private _comments = null as unknown as Comment[]
	private _dueDate = null as unknown as Date | null
	private _status = null as unknown as AssignmentStatus
	private _startedTimestamp = null as unknown as Date | null
	private _completedTimestamp = null as unknown as Date | null
	private _duration = null as unknown as number | null
	private _startTime = null as unknown as Date | null

	private static list: Assignment[] = []

	private constructor() {}

	/** The unique identifier of the assignment. */
	get id() {
		return this._id
	}

	/** The subject associated with the assignment. */
	get subject() {
		return this._subject
	}

	/** The user who assigned the assignment. */
	get assignedBy() {
		return this._assignedBy
	}

	/** The display name of the assignment. */
	get name() {
		return this._name
	}

	/** A brief description of the assignment. */
	get description() {
		return this._description
	}

	/** An array of comments associated with the assignment. */
	get comments() {
		return [...this._comments]
	}

	/** Adds a comment to the assignment.
	 * 
	 * @param comment The comment to add, including the text and author.
	 * @throws An error if the author of the comment cannot be found.
	 */
	addComment(comment: Omit<CommentInit, 'timestamp'>) {
		const newComment = Comment.create(comment)
		this._comments.push(newComment)
	}

	/** Removes a comment from the assignment by its id.
	 * 
	 * @param commentId The unique identifier of the comment to remove.
	 * @throws An error if the comment with the specified id cannot be found.
	 */
	removeComment(commentId: string) {
		const comment = this._comments.find(c => c.id === commentId)
		if (!comment) {
			throw new Error(`Comment with id "${commentId}" not found.`)
		}
		this._comments = this._comments.filter(c => c.id !== commentId)
	}

	/** The due date of the assignment, or null if no due date is set. */
	get dueDate() {
		return this._dueDate
	}

	/** The current status of the assignment. */
	get status() {
		return this._status
	}

	/** The timestamp when the assignment was started, or null if not started. */
	get startedTimestamp() {
		return this._startedTimestamp
	}

	/** The timestamp when the assignment was completed, or null if not completed. */
	get completedTimestamp() {
		return this._completedTimestamp
	}

	/** The duration of time spent on the assignment in seconds. */
	get duration() {
		return this._duration
	}

	/** Starts the assignment. */
	start() {
		if (this._status === AssignmentStatus.NOT_STARTED) {
			this._status = AssignmentStatus.IN_PROGRESS
			this._startedTimestamp = new Date()
			this._startTime = new Date()
			this._duration = 0
			this._completedTimestamp = null
		} else if (this._status === AssignmentStatus.PAUSED) {
			this._status = AssignmentStatus.IN_PROGRESS
			this._startTime = new Date()
		}
	}

	/** Pauses the assignment. */
	pause() {
		if (this._status === AssignmentStatus.IN_PROGRESS) {
			this._status = AssignmentStatus.PAUSED
			this._duration! += Math.floor((new Date().getTime() - this._startTime!.getTime()) / 1000)
			this._startTime = null
		}
	}

	/** Completes the assignment. */
	complete() {
		if (this._status === AssignmentStatus.IN_PROGRESS || this._status === AssignmentStatus.PAUSED) {
			// If the assignment is still in progress, calculate the duration up to this point.
			if (this._status === AssignmentStatus.IN_PROGRESS) {
				this._duration! += Math.floor((new Date().getTime() - this._startTime!.getTime()) / 1000)
				this._startTime = null
			}
			this._status = AssignmentStatus.COMPLETED
			this._completedTimestamp = new Date()
		}
	}

	/** Creates a new assignment and adds it to the list of assignments.
	 * 
	 * @param init The initialization object for the assignment.
	 * @returns The newly created assignment.
	 */
	static create(init: AssignmentInit): Assignment {
		const assignment = new Assignment()
		this.list.push(assignment)
		return assignment
	}

	/** Retrieves an assignment by its id.
	 * 
	 * @param identifier The id of the assignment to retrieve.
	 * @returns The assignment with the specified id, or null if not found.
	 */
	static get(identifier: string, list?: Assignment[]): Assignment | null {
		list = list ?? this.list
		const cleanId = identifier.trim().toLowerCase()
		return list.find(a => a.id.toLowerCase() === cleanId) ?? null
	}

	/** Retrieves all assignments.
	 * 
	 * @param filter Optional filter to apply to the list of assignments. Only assignments that match all properties in the filter will be returned.
	 * @return An array of assignments that match the specified filter, or all assignments if no filter is provided.
	 */
	static getAll(filter?: Partial<Assignment>): Assignment[] {
		return filter ? this.list.filter(a => {
			return Object.entries(filter).every(([key, value]) => a[key as keyof Assignment] === value)
		}) : this.list
	}
}

export default Assignment