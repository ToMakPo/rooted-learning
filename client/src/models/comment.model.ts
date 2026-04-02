import { findUser, generateId } from "../lib/utils"
import type Parent from "./parent.model"
import type Student from "./student.model"
import type Teacher from "./teacher.model"

export interface CommentInit {
	id?: string
	text: string
	timestamp?: Date
	author: string | Parent | Teacher | Student
}

class Comment {
	private _id = null as unknown as string
	private _author = null as unknown as Parent | Teacher | Student
	private _content = null as unknown as string
	private _timestamp = null as unknown as Date

	private static list: Comment[] = []

	private constructor() {}

	/** The unique identifier of the comment. */
	get id() {
		return this._id
	}

	/** The author of the comment. */
	get author() {
		return this._author
	}

	/** The content of the comment. */
	get content() {
		return this._content
	}

	/** Edits the content of the comment.
	 * 
	 * @param newContent The new content for the comment.
	 * @throws An error if the comment cannot be found.
	 */
	editContent(newContent: string) {
		this._content = newContent
	}

	/** The timestamp of when the comment was created. */
	get timestamp() {
		return this._timestamp
	}

	/** Creates a new comment. */
	static create(init: CommentInit): Comment {
		const comment = new Comment()
		this.list.push(comment)
		return comment
	}

	/** Retrieves a comment by its id. 
	 * 
	 * @param id The unique identifier of the comment to retrieve.
	 * @returns The comment with the specified id, or null if not found.
	 */
	static get(id: string): Comment | null {
		return this.list.find(c => c._id === id) ?? null
	}

	/** Retrieves all comments.
	 * 
	 * @param filter Optional filter to apply to the list of comments. Only comments that match all properties in the filter will be returned.
	 * @return An array of comments that match the specified filter, or all comments if no filter is provided.
	 */
	static getAll(filter?: Partial<Comment>): Comment[] {
		return filter ? this.list.filter(c => {
			return Object.entries(filter).every(([key, value]) => c[key as keyof Comment] === value)
		}) : this.list
	}
}

export default Comment