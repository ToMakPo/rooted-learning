import { useState, useEffect, type JSX } from "react"
import Subject, { type HierarchyNode } from "../../../models/subject.model"
import SubjectModal from "../../subject/subject.modal"
import { cleanClassName } from "../../../lib/utils"

const SubjectsSection = () => {
	const [refresh, setRefresh] = useState(false)
	useEffect(() => { if (refresh) setRefresh(false) }, [refresh])

	const [subjectModalId, setSubjectModalId] = useState<string | null>(null)

	const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([])
	useEffect(() => { fetchHierarchy() }, [refresh])

	// #region FUNCTIONS
	async function fetchHierarchy() {
		const hierarchy = await Subject.getHierarchy()
		setHierarchy(hierarchy)
	}

	// #region RENDER
	const buildSubjectList = (subjects: HierarchyNode[], level = 0): JSX.Element[] => {
		const lastIndex = subjects.length - 1

		return subjects.flatMap(({ subject, children }, index) => {
			if (!subject) return buildSubjectList(children, level) // Skip rendering this node if subject is null, but still render its children.

			let treeNodePrefix = '| '.repeat(Math.max(0, level - 1)) + (level ? (index < lastIndex ? '├─' : '└─') : '')

			if (children.length > 0) treeNodePrefix += '┬'

			const isFirstChild = index === 0
			const isLastChild = index === lastIndex

			return [
				<tr key={subject.id}>
					<td className="mono fit-column">{treeNodePrefix}</td>
					<td className="mono">{subject.id}</td>
					<td className={cleanClassName("mono", subject.keyIsDerived && "dim")}>{subject.key}</td>
					<td>{subject.name}</td>
					<td>{subject.description}</td>
					<td className="fit-column no-padding">
						<span className="actions">
							<button
								className="icon-button"
								title="Edit Subject"
								onClick={() => setSubjectModalId(subject.id)}
							>✎</button>
							<button
								className="icon-button"
								title="Delete Subject"
								onClick={async () => {
									if (window.confirm(`Are you sure you want to delete the subject "${subject.name}"? This action cannot be undone.`)) {
										await subject.delete()
										setSubjectModalId(null)
										setRefresh(true)
									}
								}
								}>🗑</button>
							<button
								className="icon-button"
								title={!isFirstChild ? "Move Subject Up" : "Already at Top"}
								disabled={isFirstChild}
								onClick={async () => {
									await subject.moveUp()
									setRefresh(true)
								}}>▲</button>
							<button
								className="icon-button"
								title={!isLastChild ? "Move Subject Down" : "Already at Bottom"}
								disabled={isLastChild}
								onClick={async () => {
									await subject.moveDown()
								setRefresh(true)
							}}>▼</button>
						</span>
					</td>
				</tr>,
				...buildSubjectList(children, level + 1)
			]
		})
	}

	const subjectModal = (
		<SubjectModal
			subjectId={subjectModalId}
			setSubjectId={setSubjectModalId}
			onSave={() => setRefresh(true)}
		/>
	)

	return (
		<section id="subjects-section" className="admin-dashboard-section">
			<h2>Subjects</h2>

			{/* First column renders hierarchy indentation markers. */}
			<table>
				<thead>
					<tr>
						<th></th>
						<th>ID</th>
						<th>Key</th>
						<th>Name</th>
						<th>Description</th>
						<th className="fit-column">Actions</th>
					</tr>
				</thead>
				<tbody>
					{buildSubjectList(hierarchy)}
				</tbody>
			</table>

			<button className="add-button primary" onClick={() => setSubjectModalId('')}>Add Subject</button>

			{subjectModal}
		</section>
	)
}

export default SubjectsSection