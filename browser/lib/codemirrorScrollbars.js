import './codemirrorScrollbars.styl'

export const enhanceWithScrollbars = (CodeMirror) => {
	if (!CodeMirror) return

	class Bar {
		constructor(codeMirror, cls, orientation, scroll) {
			this.codeMirror = codeMirror
			this.orientation = orientation
			this.scroll = scroll
			this.screen = this.total = this.size = 1
			this.pos = 0
			this.start = 0
			this.minButtonSize = 10

			this.node = document.createElement("div")
			this.node.className = cls + "-" + orientation
			this.inner = this.node.appendChild(document.createElement("div"))

			this.handleMouseDown = this.handleMouseDown.bind(this)
			this.handleClick = this.handleClick.bind(this)
			this.handleOnWheel = this.handleOnWheel.bind(this)
			this.done = this.done.bind(this)
			this.move = this.move.bind(this)
			this.update = this.update.bind(this)

			CodeMirror.on(this.inner, "mousedown", this.handleMouseDown)
			CodeMirror.on(this.node, "click", this.handleClick)
			CodeMirror.on(this.node, "mousewheel", this.handleOnWheel)
			CodeMirror.on(this.node, "DOMMouseScroll", this.handleOnWheel)
		}

		handleOnWheel(e) {
			const moved = this.codeMirror.wheelEventPixels(e)[this.orientation == "horizontal" ? "x" : "y"]
			const oldPos = this.pos
			this.moveTo(this.pos + moved)
			if (this.pos != oldPos) this.codeMirror.e_preventDefault(e)
		}

		handleClick(e) {
			this.codeMirror.e_preventDefault(e)
			const innerBox = this.inner.getBoundingClientRect()
			let where
			if (this.orientation == "horizontal")
				where = e.clientX < innerBox.left ? -1 : e.clientX > innerBox.right ? 1 : 0
			else
				where = e.clientY < innerBox.top ? -1 : e.clientY > innerBox.bottom ? 1 : 0
			this.moveTo(this.pos + where * this.screen)
		}

		done() {
			this.codeMirror.off(document, "mousemove", this.move)
			this.codeMirror.off(document, "mouseup", this.done)
		}

		move(e) {
			const axis = this.orientation == "horizontal" ? "pageX" : "pageY"
			if (e.which != 1) return this.done()
			this.moveTo(this.startpos + (e[axis] - this.start) * (this.total / this.size))
		}

		handleMouseDown(e) {
			if (e.which != 1) return
			const axis = this.orientation == "horizontal" ? "pageX" : "pageY"
			this.start = e[axis]
			this.startpos = this.pos;
			this.codeMirror.e_preventDefault(e)
			this.codeMirror.on(document, "mousemove", this.move)
			this.codeMirror.on(document, "mouseup", this.done)
		}

		setPos(pos, force) {
			if (pos < 0) pos = 0
			if (pos > this.total - this.screen) pos = this.total - this.screen
			if (!force && pos == this.pos) return false
			this.pos = pos
			this.inner.style[this.orientation == "horizontal" ? "left" : "top"] =
					(pos * (this.size / this.total)) + "px"
			return true
		}

		moveTo(pos) {
			if (this.setPos(pos)) this.scroll(pos, this.orientation)
		}

		update(scrollSize, clientSize, barSize) {
			const sizeChanged = this.screen != clientSize || this.total != scrollSize || this.size != barSize
			if (sizeChanged) {
				this.screen = clientSize
				this.total = scrollSize
				this.size = barSize
			}

			let buttonSize = this.screen * (this.size / this.total)
			if (buttonSize < this.minButtonSize) {
				this.size -= this.minButtonSize - buttonSize
				buttonSize = this.minButtonSize
			}
			this.inner.style[this.orientation == "horizontal" ? "width" : "height"] =
					buttonSize + "px"
			this.setPos(this.pos, sizeChanged)
		}
	}

	class SimpleScrollbars {
		constructor(codeMirror, cls, place, scroll) {
			this.addClass = cls;
			this.horiz = new Bar(codeMirror, cls, "horizontal___browser-lib-", scroll);
			place(this.horiz.node);
			this.vert = new Bar(codeMirror, cls, "vertical___browser-lib-", scroll);
			place(this.vert.node);
			this.width = null;
			this.update = this.update.bind(this);
		}

		update(measure) {
			if (this.width == null) {
				const style = window.getComputedStyle ? window.getComputedStyle(this.horiz.node) : this.horiz.node.currentStyle
				if (style) this.width = parseInt(style.height)
			}
			const width = this.width || 0

			const needsH = measure.scrollWidth > measure.clientWidth + 1
			const needsV = measure.scrollHeight > measure.clientHeight + 1
			this.vert.node.style.display = needsV ? "block" : "none"
			this.horiz.node.style.display = needsH ? "block" : "none"

			if (needsV) {
				this.vert.update(measure.scrollHeight, measure.clientHeight,
						measure.viewHeight - (needsH ? width : 0))
				this.vert.node.style.bottom = needsH ? width + "px" : "0"
			}
			if (needsH) {
				this.horiz.update(measure.scrollWidth, measure.clientWidth,
						measure.viewWidth - (needsV ? width : 0) - measure.barLeft)
				this.horiz.node.style.right = needsV ? width + "px" : "0"
				this.horiz.node.style.left = measure.barLeft + "px"
			}

			return {right: needsV ? width : 0, bottom: needsH ? width : 0}
		}

		setScrollTop(pos) {
			this.vert.setPos(pos)
		}

		setScrollLeft(pos) {
			this.horiz.setPos(pos)
		}

		clear() {
			const parent = this.horiz.node.parentNode
			parent.removeChild(this.horiz.node)
			parent.removeChild(this.vert.node)
		}
	}

	CodeMirror.scrollbarModel.simple = function (place, scroll) {
		return new SimpleScrollbars(CodeMirror, "codemirrorScrollbars__CodeMirror-simplescroll", place, scroll);
	};
};