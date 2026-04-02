import dotenv from 'dotenv'
dotenv.config()

import mysql from 'mysql2/promise'

async function createConnection() {
	return await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD
	})
}


/** Run a query on the database. This will return the data from the query.
 * 
 * @param {string} sql - The SQL query to run.
 * @param {any[]} params - The parameters to pass to the query. [optional]
 * 
 * @returns {mysql.RowDataPacket[]} The data from the query.
 */
export async function runQuery(sql: string, params?: any[]) {
	const db = await createConnection()
	const data = await db.execute(sql, params) as mysql.RowDataPacket[][]

	db.end()

	return data[0]
}

/** Get a specific value from the database. 
 * 
 * This will return the first row and, if columnName is provided, the value of that column, otherwise the first value in the row. 
 * 
 * @param {string} sql - The SQL query to run.
 * @param {any[]} params - The parameters to pass to the query. [optional]
 * @param {string} columnName - The name of the column to return. [optional]
 * 
 * @returns {any} The value of the column or the first value in the row.
 */
export async function getValue(sql: string, params?: any[], columnName?: string) {
	const data = await runQuery(sql, params)

	if (!data.length) return null

	if (columnName) return data[0][columnName]

	return Object.values(data[0])[0]
}

/** Run an update query on the database. 
 * 
 * @param {string} sql - The SQL query to run.
 * @param {any[]} params - The parameters to pass to the query. [optional]
 * 
 * @returns {number} The number of rows affected.
 */
export async function runUpdate(sql: string, params?: any[]) {	
	const db = await createConnection()

	const data = await db.execute(sql, params) as mysql.ResultSetHeader[]

	db.end()

	return data[0].affectedRows
}