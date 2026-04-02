import User, { UserRole, type UserInit } from "./user.model"

export interface AdminInit extends UserInit {
	role: typeof UserRole.ADMIN
}

class Admin extends User {
	private constructor() { super() }
	private static list: Admin[] = []

	/** Creates a new admin user and adds it to the list of admins.
	 * 
	 * @param init The initialization object for the admin user.
	 * @return The newly created admin user.
	 */
	static create(init: AdminInit): Admin {
		const admin = new Admin()
		this.list.push(admin)
		return admin
	}

	/** Retrieves a admin user by their id, username, or email.
	 * 
	 * @param identifier The id, username, or email of the admin user to retrieve. (case-insensitive)
	 * @param list Optional list of admins to search within. If not provided, the default list of all admins will be used.
	 * @returns The admin user with the specified identifier, or null if not found.
	 */
	static get(identifier: string, list?: User[]): Admin | null {
		return User.get(identifier, list ?? this.list) as Admin | null
	}
}

export default Admin