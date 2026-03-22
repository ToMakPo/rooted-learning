import SubjectsSection from "./sections/subjects.section"
import './admin-dashboard.styles.scss'

const AdminDashboardPage = () => {
	return (
		<main id="admin-dashboard-page">
			<header>
				<h1>Admin Dashboard</h1>
				<p>Welcome to the admin dashboard! Here you can manage users, subjects, and assignments.</p>
			</header>

			<SubjectsSection />
		</main>
	)
}

export default AdminDashboardPage