////////////////////////////////////////////
///             SCHOOL GROUP             ///
////////////////////////////////////////////

import express from 'express'
import { runQuery } from '../../../database/dbConnect'

export const router = express.Router()

export interface SchoolGroupData {
	id: number
	name: string
	description: string | null
}

export interface SchoolGroupFilters {
	id?: number
	name?: string
}

class SchoolGroup {
	private _id = null as number
	private _name = null as string
	private _description = null as string | null

	private constructor() {}

	get id() { return this._id }

	get name() { return this._name }

	get description() { return this._description }

	static async find(filters: SchoolGroupFilters = {}) : Promise<SchoolGroup[]> {
		const sender = 'SchoolGroup.find'

		const sql = `SELECT * FROM school.group WHERE ${Object.keys(filters).map(key => `${key} = ?`).join(' AND ')}`
		const data = await runQuery(sql, Object.values(filters))

		return data.map((row: any) => {
			const group = new SchoolGroup()
			group._id = row.id
			group._name = row.name
			group._description = row.description
			return group
		})
	}
}

export default SchoolGroup
