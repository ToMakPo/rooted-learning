import { cleanId, convertToKey, generateId, type setValueResults, type ValidationResults } from "../lib/utils"

export interface SubjectInit {
	id?: string | null
	key?: string | null
	parentId?: string | null
	name: string
	description?: string | null
	sortOrder?: number | null
}

export type HierarchyNode = {
	subject: Subject | null
	children: HierarchyNode[]
}

/** Represents a subject that can be assigned to lessons and tracked in the rooted learning application.
 * 
 * Examples of subjects include "Math", "Science", "History", etc.
 */
class Subject {
	private constructor() { }

	// #region ID

	private _id = undefined as unknown as string

	/** The unique identifier of the subject. */
	get id(): string { return this._id }

	/** Sets the unique identifier of the subject. 
	 * 
	 * The id must be 8 characters long and contain only letters and numbers. If the provided id is invalid, the existing id will be kept. 
	 * If no id is provided, a new random id will be generated.
	 * 
	 * @param newId The new id to set for the subject or null to generate a new random id.
	 * @param save Whether to save the subject after setting the id. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @returns The set value results.
	 */
	private async setId(newId: string | null, save: boolean = true, data: Record<string, any> = {}): setValueResults<string> {
		const sender = "Subject.setId"

		// Check if the new id is null or empty. This will mean that a new random id should be generated.
		if (!newId) {
			do newId = generateId()
			while (!Subject.list.every(s => s._id !== newId))

			// The generated id is unique, so we can safely set the id to the generated value.
			this._id = newId
			if (save) await this.save()
			return {
				sender, code: 100, valid: true, message: "Id generated successfully.", value: this._id,
				data: { ...data, generated: true, changed: true }
			}
		}

		// The passed id has a value. We will attempt to set the id to the cleaned value of the passed id.

		const idValidation = await Subject.validateId(newId, this._id)

		// If the id validation fails, we cannot set the id to the cleaned value and must keep the existing id.
		if (!idValidation.valid) {
			const errorMessage = `Invalid id:\n${idValidation.sender} - ${idValidation.code}\n${idValidation.message}`
			if (this._id === undefined)
				throw new Error(errorMessage)

			if (save) console.warn(errorMessage)
			return {
				sender, code: 500, valid: false, message: errorMessage, value: this._id,
				data: { ...data, generated: false, changed: false, idValidation }
			}
		}

		// If the cleaned id is the same as the existing id, we can safely keep the existing id.
		if (this._id === idValidation.value) {
			return {
				sender, code: 199, valid: true, message: "Id is unchanged.", value: this._id,
				data: { ...data, generated: false, changed: false, idValidation }
			}
		}

		// The cleaned id is valid. We can safely set the id to the cleaned value.
		this._id = idValidation.value

		if (save) await this.save()
		return {
			sender, code: 100, valid: true, message: "Id set successfully.", value: this._id,
			data: { ...data, generated: false, changed: true, idValidation }
		}
	}

	/** Validates a subject id.
	 * 
	 * The id must be a unique string that is 8 characters long and contains only letters and numbers.
	 * 
	 * @param value The id value to validate.
	 * @param ignoreId An optional id to ignore when checking for uniqueness.
	 * @returns The validation results.
	 */
	static async validateId(value: any, ignoreId?: string): ValidationResults<string> {
		const sender = "Subject.validateId"

		if (typeof value !== 'string')
			return { sender, code: 500, valid: false, message: "Id must be a string.", value: null as unknown as string }

		const id = cleanId(value)

		if (!id)
			return { sender, code: 501, valid: false, message: "Id must be 8 characters long and contain only letters and numbers.", value: null as unknown as string }

		if (Subject.list.some(s => s._id === id && s._id !== ignoreId))
			return { sender, code: 502, valid: false, message: `Id "${id}" is already in use.`, value: null as unknown as string }

		return { sender, code: 100, valid: true, message: "Id is valid.", value: id }
	}

	// #region KEY

	private _key = undefined as unknown as string | null

	/** The unique key of the subject. */
	get key(): string { return this._key ?? convertToKey(this._name) }

	/** Checks if the subject's key is derived from the name.
	 * 
	 * @return True if the subject's key is derived from the name, false otherwise.
	 */
	get keyIsDerived(): boolean { return this._key === null }

	/** Sets the key of the subject.
	 * 
	 * The key must be a unique string that contains only letters and numbers.
	 * 
	 * If no key is provided, the key will be derived from the name.
	 * 
	 * If the provided key or the derived key is not unique, the existing key will be kept.
	 * 
	 * @param newKey The new key to set for the subject or null to derive the key from the name.
	 * @param save Whether to save the subject after setting the key. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @return The set value results.
	 */
	async setKey(newKey: string | null, save: boolean = true, data: Record<string, any> = {}): setValueResults<string | null> {
		const sender = "Subject.setKey"

		// Check if the new key is null or empty. This will mean that the key should be derived from the name.
		if (!newKey) {
			// If the current key is also null, we can safely keep the key as null since the derived key is valid.
			if (this._key === null) {
				return {
					sender, code: 199, valid: true, message: "Key is unchanged.", value: this._key,
					data: { ...data, derived: true, changed: false }
				}
			}

			// The key should be derived from the name. If the name is not set, we cannot derive a key and must keep the existing key.
			if (this._name === undefined) {
				const errorMessage = `Invalid key:\n${sender} - 500\nKey cannot be derived from name because name is not set. Subject must have a valid key.`
				if (this._key === undefined)
					throw new Error(errorMessage)

				if (save) console.warn(errorMessage)
				return {
					sender, code: 500, valid: false, message: errorMessage, value: this._key,
					data: { ...data, derived: false, changed: false }
				}
			}

			// The key should be derived from the name. We will attempt to derive the key from the name and set it.
			const derivedKey = convertToKey(this._name)

			const keyValidation = await Subject.validateKey(derivedKey, this._id)
			// If the key validation fails, we cannot set the key to the derived value and must keep the existing key.
			if (!keyValidation.valid) {
				const errorMessage = `Invalid key:\n${keyValidation.sender} - ${keyValidation.code}\n${keyValidation.message}`
				if (this._key === undefined)
					throw new Error(errorMessage)

				if (save) console.warn(errorMessage)
				return {
					sender, code: 501, valid: false, message: errorMessage, value: this._key,
					data: { ...data, derived: !this._key, changed: false, keyValidation }
				}
			}

			// The derived key is valid. We can safely set the key to null to indicate that it should be derived from the name.
			this._key = null
			if (save) await this.save()
			return {
				sender, code: 100, valid: true, message: "Key derived from name successfully.", value: this._key,
				data: { ...data, derived: true, changed: true, keyValidation }
			}
		}

		// The passed key has a value. We will attempt to set the key to the converted value of the passed key.
		const convertedKey = convertToKey(newKey)
		const keyValidation = await Subject.validateKey(convertedKey, this._id)

		// If the key validation fails, we cannot set the key to the converted value and must keep the existing key.
		if (!keyValidation.valid) {
			const errorMessage = `Invalid key:\n${keyValidation.sender} - ${keyValidation.code}\n${keyValidation.message}`
			if (this._key === undefined)
				throw new Error(errorMessage)

			if (save) console.warn(errorMessage)
			return {
				sender, code: 502, valid: false, message: errorMessage, value: this._key,
				data: { ...data, derived: !this._key, changed: false, keyValidation }
			}
		}

		// If the converted key is the same as the existing key, we can safely keep the existing key.
		if (this._key === convertedKey) {
			return {
				sender, code: 198, valid: true, message: "Key is unchanged.", value: this._key,
				data: { ...data, derived: false, changed: false, keyValidation }
			}
		}

		// The converted key is valid. We can safely set the key to the converted value.
		this._key = convertedKey

		if (save) await this.save()
		return {
			sender, code: 100, valid: true, message: "Key set successfully.", value: this._key,
			data: { ...data, derived: false, changed: true, keyValidation }
		}
	}

	/** Validates a subject key.
	 * 
	 * @param value The key value to validate.
	 * @param ignoreId An optional id to ignore when checking for uniqueness.
	 * @returns The validation results.
	 */
	static async validateKey(value: any, ignoreId?: string): ValidationResults<string> {
		const sender = "Subject.validateKey"

		if (typeof value !== 'string')
			return { sender, code: 500, valid: false, message: "Key must be a string.", value: null as unknown as string }

		const key = convertToKey(value)

		if (!key)
			return { sender, code: 501, valid: false, message: "Key must contain at least one letter or number.", value: null as unknown as string }

		if (Subject.list.some(s => s._key === key && s._id !== ignoreId))
			return { sender, code: 502, valid: false, message: `Key "${key}" is already in use.`, value: null as unknown as string }

		return { sender, code: 100, valid: true, message: "Key is valid.", value: key }
	}

	// #region PARENT ID

	private _parentId = undefined as unknown as string | null

	/** The id of the parent subject, or null if this subject is a top-level subject. */
	get parentId(): string | null { return this._parentId }

	static async validateParentId(value: any, ignoreId?: string): ValidationResults<string | null> {
		const sender = "Subject.validateParentId"

		if (value == null) {
			// Parent id is null or undefined, which is valid. We will treat this as null to indicate that this subject is a top-level subject.
			return { sender, code: 101, valid: true, message: "Parent id is valid.", value: null }
		}

		if (typeof value !== 'string')
			return { sender, code: 500, valid: false, message: "Parent id must be a string.", value: null }

		const parentId = cleanId(value)

		if (!parentId)
			return { sender, code: 501, valid: false, message: "Parent id must be 8 characters long and contain only letters and numbers.", value: null }

		if (!Subject.list.some(s => s._id === parentId))
			return { sender, code: 502, valid: false, message: `Parent subject with id "${parentId}" does not exist.`, value: null }

		if (parentId === ignoreId)
			return { sender, code: 503, valid: false, message: "Parent id cannot be the same as the subject id.", value: null }

		if (ignoreId) {
			// If an ignoreId is provided, we need to check that the parent id is not a descendant of the subject id to prevent circular 
			// relationships. If the parent id is a descendant of the subject id, we cannot set the parent id to the provided value and must
			// keep the existing parent id.
			const ancestoryCheck = await (async () => {
				const self = await Subject.find(ignoreId)
				if (!self) return true
				const selfIsAncestorOfParent = await self.isAncestorOf(parentId)
				return !selfIsAncestorOfParent
			})()
			if (!ancestoryCheck)
				return { sender, code: 504, valid: false, message: "Parent id cannot be a decendant of the subject.", value: null }
		}

		return { sender, code: 100, valid: true, message: "Parent id is valid.", value: parentId }
	}

	/** Gets the parent subject of this subject, or null if this subject is a top-level subject. */
	async getParent(): Promise<Subject | null> {
		if (!this._parentId) return null
		return await Subject.find(this._parentId) ?? null
	}

	/** Sets the parent subject and moves this subject to the end of the destination sibling list. */
	async setParentId(newParentId: any, save: boolean = true, data: Record<string, any> = {}): setValueResults<string | null> {
		const sender = "Subject.setParentId"

		const parentIdValidation = await Subject.validateParentId(newParentId, this._id)

		if (!parentIdValidation.valid) {
			const errorMessage = `Invalid parent id: ${parentIdValidation.message}`
			if (this._parentId === undefined)
				throw new Error(errorMessage)

			if (save) console.warn(errorMessage)
			return {
				sender, code: 500, valid: false, message: errorMessage, value: this._parentId,
				data: { ...data, changed: false, parentIdValidation }
			}
		}

		if (this._parentId === parentIdValidation.value) {
			return {
				sender, code: 199, valid: true, message: "Parent id is unchanged.", value: this._parentId,
				data: { ...data, changed: false, parentIdValidation }
			}
		}

		const previousParentId = this._parentId ?? null
		this._parentId = parentIdValidation.value

		Subject.assignSortOrders(Subject.getOrderedSiblings(previousParentId, this._id))
		this._sortOrder = Subject.getOrderedSiblings(this._parentId, this._id).length

		if (save) await this.save()
		return {
			sender, code: 100, valid: true, message: "Parent id set successfully.", value: this._parentId,
			data: { ...data, changed: true, parentIdValidation }
		}
	}

	/** Gets all ancestor subjects of this subject.
	 * 
	 * If this subject is a top-level subject, an empty array will be returned.
	 * 
	 * This method uses a loop to traverse up the subject hierarchy and collect all ancestor subjects until it reaches a top-level subject.
	 */
	async getAncestors(): Promise<Subject[]> {
		const idMap = new Map<string, Subject>(Subject.list.map(s => [s._id, s]))
		const ancestors: Subject[] = []
		let current: Subject | undefined = idMap.get(this._parentId ?? "")
		while (current) {
			ancestors.push(current)
			current = idMap.get(current._parentId ?? "")
		}
		return ancestors
	}

	/** Checks if this subject is an ancestor of the given subject.
	 * 
	 * In other words, this checks if the given subject is a descendant of this subject.
	 * 
	 * @param subject The subject or subject id to check.
	 * @returns True if this subject is an ancestor of the given subject, false otherwise.
	 */
	async isAncestorOf(subject: string | Subject): Promise<boolean> {
		const decendants = await this.getDecendants()
		const subjectId = typeof subject === 'string' ? subject : subject._id
		return decendants.some(s => s._id === subjectId)
	}

	/** Gets all sibling subjects of this subject. */
	async getSiblings(): Promise<Subject[]> {
		const siblings = await Subject.findAll({ parentId: this._parentId })
		return siblings.filter(s => s._id !== this._id)
	}

	/** Checks if this subject is a sibling of the given subject.
	 * 
	 * In other words, this checks if the given subject has the same parent as this subject.
	 * 
	 * @param subject The subject or subject id to check.
	 * @return True if this subject is a sibling of the given subject, false otherwise.
	 */
	async isSiblingOf(subject: string | Subject): Promise<boolean> {
		const siblings = await this.getSiblings()
		const subjectId = typeof subject === 'string' ? subject : subject._id
		return siblings.some(s => s._id === subjectId)
	}

	/** Gets all child subjects of this subject. */
	async getChildren(): Promise<Subject[]> {
		return await Subject.findAll({ parentId: this._id })
	}

	/** Gets all descendant subjects of this subject.
	 * 
	 * If this subject has no children, an empty array will be returned.
	 * 
	 * This method uses a breadth-first search algorithm to traverse the subject hierarchy and collect all descendant subjects.
	 * 
	 * @returns An array of all descendant subjects of this subject.
	 */
	async getDecendants(): Promise<Subject[]> {
		const childrenMap = new Map<string | null, Subject[]>()

		for (const s of Subject.list) {
			const pid = s._parentId ?? null

			if (!childrenMap.has(pid)) childrenMap.set(pid, [])

			childrenMap.get(pid)!.push(s)
		}

		const decendants: Subject[] = []
		const queue = [...(childrenMap.get(this._id) ?? [])]

		while (queue.length > 0) {
			const node = queue.shift()!
			decendants.push(node)
			queue.push(...(childrenMap.get(node._id) ?? []))
		}

		return decendants
	}

	/** Checks if this subject is a descendant of the given subject.
	 * 
	 * In other words, this checks if the given subject is an ancestor of this subject.
	 * 
	 * @param subject The subject or subject id to check.
	 * @return True if this subject is a descendant of the given subject, false otherwise.
	 */
	async isDecendantOf(subject: string | Subject): Promise<boolean> {
		const subjectId = typeof subject === 'string' ? subject : subject._id
		const idMap = new Map<string, Subject>(Subject.list.map(s => [s._id, s]))
		let current = this._parentId ? idMap.get(this._parentId) : undefined
		while (current) {
			if (current._id === subjectId) return true
			current = current._parentId ? idMap.get(current._parentId) : undefined
		}
		return false
	}

	/** Gets all non-descendant subjects of this subject. */
	async getNoneDecendants(): Promise<Subject[]> {
		const decendants = await this.getDecendants()
		const decendantIds = new Set(decendants.map(d => d._id))
		return Subject.list.filter(s => s._id !== this._id && !decendantIds.has(s._id))
	}

	// #region NAME

	private _name = undefined as unknown as string

	/** The display name of the subject. */
	get name(): string { return this._name }

	/** Sets the display name of the subject.
	 * 
	 * The name must be a unique, non-empty string and must not result in a key that is already in use by another subject.
	 * 
	 * If the provided name is invalid, the existing name will be kept.
	 * 
	 * @param newName The new name to set for the subject.
	 * @param save Whether to save the subject after setting the name. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @return The set value results.
	 */
	async setName(newName: string, save: boolean = true, data: Record<string, any> = {}): setValueResults<string> {
		const sender = "Subject.setName"

		const nameValidation = await Subject.validateName(newName, this._id)

		// If the name validation fails, we cannot set the name to the cleaned value and must keep the existing name.
		if (!nameValidation.valid) {
			const errorMessage = `Invalid name:\n${nameValidation.sender} - ${nameValidation.code}\n${nameValidation.message}`
			if (this._name === undefined)
				throw new Error(errorMessage)

			if (save) console.warn(errorMessage)
			return {
				sender, code: 500, valid: false, message: errorMessage, value: this._name,
				data: { ...data, nameValidation, changed: false }
			}
		}

		// If the cleaned name is the same as the existing name, we can safely keep the existing name.
		if (this._name === nameValidation.value) {
			return {
				sender, code: 199, valid: true, message: "Name is unchanged.", value: this._name,
				data: { ...data, nameValidation, changed: false }
			}
		}

		// The cleaned name is valid. We can safely set the name to the cleaned value.
		this._name = nameValidation.value

		if (save) await this.save()
		return {
			sender, code: 100, valid: true, message: "Name set successfully.", value: this._name,
			data: { ...data, nameValidation, changed: true }
		}
	}

	/** Validates a subject name.
	 * 
	 * The name must be a unique, non-empty string and must not result in a key that is already in use by another subject.
	 * 
	 * @param value The name value to validate.
	 * @param ignoreId An optional id to ignore when checking for uniqueness.
	 * @returns The validation results.
	 */
	static async validateName(name: string, ignoreId?: string): ValidationResults<string> {
		const sender = "Subject.validateName"

		if (typeof name !== 'string')
			return { sender, code: 500, valid: false, message: "Name must be a string.", value: null as unknown as string }

		name = name.trim()

		if (name.length === 0)
			return { sender, code: 501, valid: false, message: "Name cannot be empty.", value: null as unknown as string }

		const key = convertToKey(name)

		if (Subject.list.some(s => s.key === key && s._id !== ignoreId))
			return { sender, code: 502, valid: false, message: `Name "${name}" is already in use.`, value: null as unknown as string }

		return { sender, code: 100, valid: true, message: "Name is valid.", value: name }
	}

	// #region DESCRIPTION

	private _description = undefined as unknown as string

	/** A brief description of the subject.
	 * 
	 * This will be treated as markdown and can be used to provide additional information about the subject.
	 */
	get description(): string { return this._description }

	/** Sets the description of the subject.
	 * 
	 * The description can be any string, including an empty string. It will be treated as markdown and can be used to provide additional 
	 * information about the subject.
	 * 
	 * @param newDescription The new description to set for the subject.
	 * @param save Whether to save the subject after setting the description. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @return The set value results.
	 */
	async setDescription(newDescription: string | null, save: boolean = true, data: Record<string, any> = {}): setValueResults<string> {
		const sender = "Subject.setDescription"

		const descriptionValidation = await Subject.validateDescription(newDescription)

		// If the description validation fails, we cannot set the description to the cleaned value and must keep the existing description.
		if (!descriptionValidation.valid) {
			const errorMessage = `Invalid description: ${descriptionValidation.message}`
			if (this._description === undefined)
				this._description = ""

			if (save) console.warn(errorMessage)
			return {
				sender, code: 500, valid: false, message: errorMessage, value: this._description,
				data: { ...data, changed: false, descriptionValidation }
			}
		}

		// If the cleaned description is the same as the existing description, we can safely keep the existing description.
		if (this._description === descriptionValidation.value) {
			return {
				sender, code: 199, valid: true, message: "Description is unchanged.", value: this._description,
				data: { ...data, changed: false, descriptionValidation }
			}
		}

		// The cleaned description is valid. We can safely set the description to the cleaned value.
		this._description = descriptionValidation.value

		if (save) await this.save()
		return {
			sender, code: 100, valid: true, message: "Description set successfully.", value: this._description,
			data: { ...data, changed: true, descriptionValidation }
		}
	}

	/** Validates a subject description.
	 * 
	 * The description can be any string, including an empty string. It will be treated as markdown and can be used to provide additional
	 * information about the subject.
	 * 
	 * If the description is null or undefined, it will be treated as an empty string.
	 * 
	 * @param value The description value to validate.
	 * @returns The validation results.
	 */
	static async validateDescription(value: any): ValidationResults<string> {
		const sender = "Subject.validateDescription"

		if (value == null) {
			// Description is null or undefined, which is valid. We will treat this as an empty string.
			return { sender, code: 101, valid: true, message: "Description is valid.", value: "" }
		}

		if (typeof value !== 'string')
			return { sender, code: 500, valid: false, message: "Description must be a string.", value: null as unknown as string }

		const description = value.trim()

		return { sender, code: 100, valid: true, message: "Description is valid.", value: description }
	}

	// #region SORT ORDER

	private _sortOrder = undefined as unknown as number

	/** The sort order of the subject in the list. */
	get sortOrder(): number { return this._sortOrder }

	/** Sets the sort order of the subject in the list.
	 * 
	 * The sort order only applies within this subject's sibling list. If the sort order is less than 0, it will be treated as 0. If the 
	 * sort order is greater than the last sibling index, it will be treated as the last sibling index.
	 * 
	 * The sort order of the other sibling subjects will be automatically adjusted to accommodate the new sort order of this subject.
	 * 
	 * If the provided sort order is invalid, the existing sort order will be kept.
	 * 
	 * @param newSortOrder The new sort order to set for the subject.
	 * @param save Whether to save the subject after setting the sort order. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @return The set value results.
	 */
	async setSortOrder(newSortOrder: any, save: boolean = true, data: Record<string, any> = {}): setValueResults<number> {
		const sender = "Subject.setSortOrder"

		// Validate the new sort order value.
		const sortOrderValidation = await Subject.validateSortOrder(newSortOrder, this._parentId, this._id)

		// If the sort order validation fails, we cannot set the sort order to the cleaned value and must keep the existing sort order.
		if (!sortOrderValidation.valid) {
			const errorMessage = `Invalid sort order "${newSortOrder}": ${sortOrderValidation.message}`
			if (this._sortOrder === undefined)
				this._sortOrder = Subject.getOrderedSiblings(this._parentId, this._id).length

			if (save) console.warn(errorMessage)
			return {
				sender, code: 500, valid: false, message: errorMessage, value: this._sortOrder,
				data: { ...data, changed: false, sortOrderValidation }
			}
		}

		// If the cleaned sort order is the same as the existing sort order, we can safely keep the existing sort order.
		if (this._sortOrder === sortOrderValidation.value) {
			return {
				sender, code: 199, valid: true, message: "Sort order is unchanged.", value: this._sortOrder,
				data: { ...data, changed: false, sortOrderValidation }
			}
		}

		const siblings = Subject.getOrderedSiblings(this._parentId, this._id)
		siblings.splice(sortOrderValidation.value, 0, this)
		Subject.assignSortOrders(siblings)

		if (save) await this.save()
		return {
			sender, code: 100, valid: true, message: "Sort order set successfully.", value: this._sortOrder,
			data: { ...data, changed: true, sortOrderValidation }
		}
	}

	/** Moves the subject up one position in the list.
	 * 
	 * If the subject is already at the top of the list, this will have no effect.
	 * 
	 * @param save Whether to save the subject after moving it up. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @returns The set value results.
	 */
	async moveUp(save: boolean = true, data: Record<string, any> = {}): setValueResults<number> {
		return await this.setSortOrder(this._sortOrder - 1, save, data)
	}

	/** Moves the subject down one position in the list.
	 * 
	 * If the subject is already at the bottom of the list, this will have no effect.
	 * 
	 * @param save Whether to save the subject after moving it down. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @returns The set value results.
	 */
	async moveDown(save: boolean = true, data: Record<string, any> = {}): setValueResults<number> {
		return await this.setSortOrder(this._sortOrder + 1, save, data)
	}

	/** Moves the subject to the top of the list.
	 * 
	 * If the subject is already at the top of the list, this will have no effect.
	 * 
	 * @param save Whether to save the subject after moving it to the top. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @returns The set value results.
	 */
	async moveToTop(save: boolean = true, data: Record<string, any> = {}): setValueResults<number> {
		return await this.setSortOrder(0, save, data)
	}

	/** Moves the subject to the bottom of the list.
	 * 
	 * If the subject is already at the bottom of the list, this will have no effect.
	 * 
	 * @param save Whether to save the subject after moving it to the bottom. Defaults to true.
	 * @param data Additional data to include in the set value results.
	 * @returns The set value results.
	 */
	async moveToBottom(save: boolean = true, data: Record<string, any> = {}): setValueResults<number> {
		return await this.setSortOrder(Subject.getOrderedSiblings(this._parentId, this._id).length, save, data)
	}

	/** Validates a subject sort order.
	 * 
	 * The sort order is constrained to the current sibling list for the given parent id.
	 * 
	 * @param value The sort order value to validate.
	 * @returns The validation results.
	 */
	static async validateSortOrder(value: any, parentId: string | null = null, ignoreId?: string): ValidationResults<number> {
		const sender = "Subject.validateSortOrder"
		const siblingCount = Subject.getOrderedSiblings(parentId, ignoreId).length

		if (value == null)
			return { sender, code: 101, valid: true, message: "Sort order is valid.", value: siblingCount }

		if (typeof value !== 'number') {
			if (isNaN(Number(value)))
				return { sender, code: 500, valid: false, message: "Sort order must be a number.", value: null as unknown as number }

			value = Number(value)
		}

		if (value < 0) value = 0
		else if (value > siblingCount) value = siblingCount

		return { sender, code: 100, valid: true, message: "Sort order is valid.", value }
	}

	// #region METHODS

	/** Sets multiple properties of the subject at once.
	 * 
	 * This method accepts an object containing the properties to update and their new values. It will attempt to set each property using 
	 * the corresponding setter method for that property. If any of the updates are invalid, the valid updates will still be applied and the 
	 * invalid updates will be skipped, with the existing values kept for the invalid updates. The method will return an object containing 
	 * the results of each attempted update, including whether the update was successful, any validation messages, and the new value for 
	 * the property if the update was successful.
	 * 
	 * @param updates An object containing the properties to update and their new values.
	 * @param save Whether to save the subject after applying the updates. Defaults to true.
	 * @param data Additional data to include in the set value results for each property update.
	 * @returns An object containing the results of each attempted update.
	 */
	async set(updates: Partial<SubjectInit>, save: boolean = true, data: Record<string, any> = {}): Promise<setValueResults<Subject>> {
		const sender = "Subject.set"

		const results: Record<string, Awaited<setValueResults<any>>> = {}

		if (updates.id !== undefined && this._id === undefined) {
			results.id = await this.setId(updates.id ?? null, false, data)
		}

		if (updates.name !== undefined) {
			results.name = await this.setName(updates.name, false, data)
		}

		if (updates.key !== undefined) {
			results.key = await this.setKey(updates.key ?? null, false, data)
		}

		if (updates.description !== undefined) {
			results.description = await this.setDescription(updates.description ?? null, false, data)
		}

		if (updates.parentId !== undefined) {
			results.parentId = await this.setParentId(updates.parentId ?? null, false, data)
		}

		if (updates.sortOrder !== undefined) {
			results.sortOrder = await this.setSortOrder(updates.sortOrder, false, data)
		}

		const passed = Object.values(results).every(r => r.valid)

		if (!passed) {
			const errorMessage = `One or more updates are invalid:\n${sender} - 500\n${Object.entries(results).map(([key, result]) => {
				if (result.valid) return `${key}: valid`
				return `${key}: invalid - ${result.message}`
			}).join("\n")}`
			if (save) {
				console.warn(errorMessage)
				console.dir(results)
			}
			return { sender, code: 500, valid: false, message: errorMessage, value: this, data: { ...data, results } }
		}

		if (save) await this.save()

		return { sender, code: 100, valid: true, message: "Subject updated successfully.", value: this, data: { ...data, results } }
	}

	/** Saves the subject data.
	 * 
	 * Currently, this method saves the subject data to local storage. In the future, this will need to be replaced with a call to the 
	 * backend API to save the subject data to a database. We will need to implement a method for saving a subject that handles this process.
	 * 
	 * @returns A promise that resolves when the save operation is complete.
	 */
	async save(): Promise<setValueResults<Subject>> {
		localStorage.setItem("subjects", JSON.stringify(Subject.list.map(s => s.toJSON())))

		return { sender: "Subject.save", code: 100, valid: true, message: "Subject saved successfully.", value: this, data: {} }

		// TODO: This will eventually need to be replaced with a call to the backend API to save the subject data to a database. We will 
		// need to implement a method for saving a subject that handles this process.
	}

	/** Deletes the subject from the list of subjects. */
	async delete(): Promise<setValueResults<Subject>> {
		const sender = "Subject.delete"

		await this.moveToBottom(false)
		Subject.list = Subject.list.filter(s => s._id !== this._id)
		await this.save()
		return { sender, code: 100, valid: true, message: "Subject deleted successfully.", value: this, data: {} }

		// TODO: We should also delete any associated records, such as lessons that are associated with this subject. We will need to 
		// implement a method for deleting a subject that handles this cleanup process.
	}

	/** Converts the subject instance to a plain object.
	 * 
	 * @returns A plain object representation of the subject instance.
	 */
	toJSON() {
		return {
			id: this._id,
			key: this._key,
			parentId: this._parentId,
			name: this._name,
			description: this._description,
			sortOrder: this._sortOrder
		}
	}

	/** Converts the subject instance to a JSON string. */
	toString() {
		return JSON.stringify(this.toJSON())
	}

	// #region STATIC

	private static list: Subject[] = []

	private static compareSubjects(a: Subject, b: Subject): number {
		return a._sortOrder - b._sortOrder || a._name.localeCompare(b._name) || a._id.localeCompare(b._id)
	}

	private static getOrderedSiblings(parentId: string | null, ignoreId?: string): Subject[] {
		return Subject.list
			.filter(subject => subject._parentId === parentId && subject._id !== ignoreId)
			.sort(Subject.compareSubjects)
	}

	private static assignSortOrders(subjects: Subject[]): void {
		subjects.forEach((subject, index) => {
			subject._sortOrder = index
		})
	}

	/** Creates a new subject and adds it to the list of subjects.
	 * 
	 * @param init The initialization object for the subject.
	 * @returns The newly created subject.
	 */
	static async create(init: SubjectInit): Promise<setValueResults<Subject>> {
		const sender = "Subject.create"

		const newSubject = new Subject()

		init = {
			id: init.id ?? null,
			key: init.key ?? null,
			parentId: init.parentId ?? null,
			name: init.name,
			description: init.description ?? null,
			sortOrder: init.sortOrder ?? null
		} as SubjectInit

		const setResults = await newSubject.set(init, false)

		if (!setResults.valid) {
			const errorMessage = `Failed to create subject:\n${sender} - 500`
			return { sender, code: 500, valid: false, message: errorMessage, value: newSubject, data: setResults.data }
		}

		Subject.list.push(newSubject)
		await newSubject.save()
		return { sender, code: 100, valid: true, message: "Subject created successfully.", value: newSubject, data: setResults.data }
	}

	/** Retrieves a subject by its id or name.
	 * 
	 * @param identifier The id or name of the subject to retrieve. (case-insensitive)
	 * @param list Optional list of subjects to search within. If not provided, the default list of all subjects will be used.
	 * @returns The subject with the specified identifier, or null if not found.
	 */
	static async find(identifier: string, list?: Subject[]): Promise<Subject | null> {
		list = list ?? this.list
		const cleanId = identifier.trim().toLowerCase()
		const cleanKey = convertToKey(identifier)
		return list.find(s => s._id.toLowerCase() === cleanId || s._key === cleanKey) ?? null
	}

	/** Retrieves all subjects, optionally filtered by specified criteria.
	 * 
	 * @param filter An optional object containing key-value pairs to filter the subjects by. The keys should correspond to the properties 
	 * of the Subject class, and the values should be the desired values for those properties. Only subjects that match all of the specified 
	 * criteria will be included in the returned array.
	 * @returns An array of subjects that match the specified filter criteria, or all subjects if no filter is provided.
	 */
	static async findAll(filter?: Partial<Subject>): Promise<Subject[]> {
		return filter ? this.list.filter(s => {
			return Object.entries(filter).every(([key, value]) => s[key as keyof Subject] === value)
		}) : this.list
	}

	/** Returns a blank subject initialization object. */
	static getBlank(): SubjectInit {
		return {
			id: undefined as unknown as string,
			key: undefined as unknown as string,
			parentId: undefined as unknown as string | null,
			name: undefined as unknown as string,
			description: undefined as unknown as string,
			sortOrder: undefined as unknown as number
		}
	}

	/** Gets the subject hierarchy as a nested structure of subjects and their children.
	 * 
	 * The hierarchy is represented as an array of objects, where each object contains a subject and an array of its child subjects. The 
	 * child subjects are represented in the same format, allowing for a recursive structure that can represent any depth of hierarchy.
	 * 
	 * @returns An array of objects representing the subject hierarchy, where each object contains a subject and an array of its child subjects.
	 */
	static async getHierarchy() {
		const hierarchy: Record<string, HierarchyNode> = {
			'root': { subject: null as unknown as Subject, children: [] },
			...Object.fromEntries(Subject.list.map(s => [s._id, { subject: s, children: [] }]))
		}

		for (const subject of Subject.list) {
			const parentId = subject._parentId && subject._parentId in hierarchy ? subject._parentId : 'root'
			hierarchy[parentId].children.push(hierarchy[subject._id])
		}

		for (const node of Object.values(hierarchy)) {
			node.children.sort((a, b) => Subject.compareSubjects(a.subject!, b.subject!))
		}

		return hierarchy['root'].children
	}
}

/** Loads the subjects from local storage when the module is first imported. */
async function load() {
	const subjects = localStorage.getItem("subjects")
	if (!subjects) return

	for (const subject of JSON.parse(subjects) as SubjectInit[]) {
		await Subject.create(subject)
	}

	// TODO: This will eventually need to be replaced with a call to the backend API to load the subject data from a database. We will need 
	// to implement a method for loading subjects that handles this process.
}
void load()

export default Subject