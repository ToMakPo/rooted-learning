import './subject.styles.scss'

interface SubjectPageProps {
	subject: string
}

const SubjectPage = (props: SubjectPageProps) => {
	const { subject } = props

	return (
		<div id="subject-page">
			<h1>{subject}</h1>
		</div>
	)
}

export default SubjectPage