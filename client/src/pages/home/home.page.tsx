import Subject from '../../models/subject.model'
import './home.styles.scss'

const HomePage = () => {
	const subjects = Subject.findAll().map(s => s.name)
	
	return (
		<div id="home-page">
			<h1>Rooted learning!</h1>

			<p>Track your progress and stay organized with our easy-to-use platform.</p>
			<ul>
				{subjects.map((subject) => (
					<li key={subject}>{subject}</li>
				))}
			</ul>
		</div>
	)
}

export default HomePage