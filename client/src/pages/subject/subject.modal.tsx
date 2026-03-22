import { useEffect, useState } from "react"
import Modal from "../../components/modal/modal.component"
import Subject from "../../models/subject.model"
import { convertToKey } from "../../lib/utils"

export interface SubjectModalProps {
	subjectId: string | null
	setSubjectId: (subjectId: string | null) => void

	onSave?: (subject: Subject) => void
}

// const subjects = ['Math', 'Science', 'History', 'Language Arts', 'Physical Education', 'Art', 'Music', 'Foreign Language', 'Computer Science']

const SubjectModal = (props: SubjectModalProps) => {
	const [subject, setSubject] = useState<Subject | null>(null)
	useEffect(() => { fetchSubject() }, [props.subjectId])

	const [noneDecendants, setNoneDecendants] = useState<Subject[]>([])
	useEffect(() => { fetchNoneDecendants(subject) }, [subject])

	const [action, setAction] = useState('Add')
	const [key, setKey] = useState('')
	const [parentId, setParentId] = useState('')
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	useEffect(() => initializeSubjectState(subject), [subject])

	// #region FUNCTIONS
	async function fetchSubject() {
		if (props.subjectId) {
			const subject = await Subject.find(props.subjectId)
			setSubject(subject)
		} else {
			setSubject(null)
		}
	}

	async function fetchNoneDecendants(subject: Subject | null) {
		if (subject) {
			const noneDecendants = await subject.getNoneDecendants()
			setNoneDecendants(noneDecendants)
		} else {
			const allSubjects = await Subject.findAll()
			setNoneDecendants(allSubjects)
		}
	}

	function initializeSubjectState(subject: Subject | null) {
		setAction(subject ? 'Edit' : 'Add')
		setKey(subject && !subject.keyIsDerived ? subject.key : '')
		setParentId(subject?.parentId ?? '')
		setName(subject?.name ?? '')
		setDescription(subject?.description ?? '')
	}

	function close() {
		initializeSubjectState(null)
		props.setSubjectId(null)
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		let saved = false

		switch (action) {
			case "Add":
				const createResult = await Subject.create({ key, name, description, parentId: parentId || null })

				saved = createResult.valid
				break
			case "Edit":
				if (!props.subjectId) {
					console.error("Cannot edit subject without an id.")
					return
				}

				const subjectToUpdate = await Subject.find(props.subjectId)
				if (!subjectToUpdate) {
					console.error("Subject not found.")
					return
				}

				const updateResult = await subjectToUpdate.set({ key, name, description, parentId: parentId || null })

				saved = updateResult.valid

				break
		}

		if (saved) {
			if (props.onSave) props.onSave(subject!)
			close()
		}
	}

	// #region RENDER
	return (
		<Modal id='subject-modal'
			show={props.subjectId !== null}
			close={close}
		>
			<h2>{action + " Subject"}</h2>

			<form onSubmit={handleSubmit}>
				<div className="input-group">
					<label htmlFor="subject-key">Key</label>
					<input type="text" id="subject-key" name="key"
						placeholder={convertToKey(name)}
						value={key}
						onChange={e => setKey(e.target.value)} />
				</div>

				<div className="input-group">
					<label htmlFor="subject-parent">Parent</label>
					<select id="subject-parent" name="parent"
						value={parentId}
						onChange={e => setParentId(e.target.value)}>
						<option value="">None</option>
						{noneDecendants.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
					</select>
				</div>

				<div className="input-group">
					<label htmlFor="subject-name">Name</label>
					<input type="text" id="subject-name" name="name"
						placeholder="The name of the subject."
						value={name}
						onChange={e => setName(e.target.value)} />
				</div>

				<div className="input-group">
					<label htmlFor="subject-description">Description</label>
					<textarea id="subject-description" name="description"
						placeholder="A brief description of the subject."
						value={description}
						onChange={e => setDescription(e.target.value)} />
				</div>

				<button type="submit">Save</button>
			</form>
		</Modal>
	)
}

export default SubjectModal