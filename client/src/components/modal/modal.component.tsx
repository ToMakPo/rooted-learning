import './modal.style.scss'

export interface ModalProps {
	id?: string
	className?: string

	allowBackdropClose?: boolean
	showCloseButton?: boolean

	show: boolean
	close: () => void
	onClose?: () => void

	children: React.ReactNode
}

const Modal = (props: ModalProps) => {
	if (!props.show) return null

	const { id, className, 
		allowBackdropClose = false, 
		showCloseButton = true, 
		onClose, children
	} = props

	function close() {
		props.close()
		if (onClose) onClose()
	}

	return (
		<div id={id} 
			className={["modal", className?.split(" ") ?? ""].filter(Boolean).join(" ")} 
			onClick={allowBackdropClose ? close : undefined}
		>
			<div className="modal-content" onClick={e => e.stopPropagation()}>
				{showCloseButton && <button className="modal-close-button" onClick={close}>&times;</button>}
				{children}
			</div>
		</div>
	)
}

export default Modal