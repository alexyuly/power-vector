new class {
  constructor() {
    this.canvasRoot = document.getElementById('canvas-root');
    this.canvasAnchor = document.getElementById('canvas-anchor');
    this.contextMenu = document.getElementById('context-menu');
    this.addLine = document.getElementById('add-line');
    this.resetViewport = document.getElementById('reset-viewport');

    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('contextmenu', this.onDocumentContextMenu.bind(this));
    document.addEventListener('keydown', this.onDocumentKeyDown.bind(this))
    this.canvasRoot.addEventListener('contextmenu', this.onSvgRootContextMenu.bind(this));
    this.canvasRoot.addEventListener('pointerdown', this.onSvgRootPointerDown.bind(this));
    this.canvasRoot.addEventListener('pointermove', this.onSvgRootPointerMove.bind(this));
    this.canvasRoot.addEventListener('pointerup', this.onSvgRootPointerUp.bind(this));
    this.canvasRoot.addEventListener('wheel', this.onSvgRootWheel.bind(this));
    this.contextMenu.addEventListener('click', this.onContextMenuClick.bind(this));
    this.addLine.addEventListener('click', this.onAddLineClick.bind(this));
    this.resetViewport.addEventListener('click', this.onResetViewportClick.bind(this));

    this.onWindowResize();
    this.canvasRoot.style.cursor = 'grab';
  }

  onWindowResize() {
    // TODO account for current viewBox
    const viewboxX = window.innerWidth / -2;
    const viewboxY = window.innerHeight / -2;
    const viewboxWidth = window.innerWidth;
    const viewboxHeight = window.innerHeight;
  
    this.canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${viewboxWidth} ${viewboxHeight}`);
  }

  onDocumentContextMenu(event) {
    event.preventDefault();
  }

  onDocumentKeyDown(event) {
    if (event.key === 'Esc' || event.key === 'Escape') {
      this.canvasAnchor.style.display = 'none';
      this.contextMenu.classList.remove('open');
      this.canvasRoot.style.cursor = 'grab';
    }
  }

  onSvgRootContextMenu(event) {
    const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);

    this.canvasRoot.style.cursor = 'default';
    this.canvasAnchor.style.display = 'initial';
    this.canvasAnchor.setAttribute('cx', viewboxX);
    this.canvasAnchor.setAttribute('cy', viewboxY);
    this.contextMenu.classList.add('open');
    this.contextMenu.style.left = `${event.clientX - (this.contextMenu.offsetWidth < window.innerWidth - event.clientX ? 0 : this.contextMenu.offsetWidth)}px`;
    this.contextMenu.style.top = `${event.clientY - (this.contextMenu.offsetHeight < window.innerHeight - event.clientY ? 0 : this.contextMenu.offsetHeight)}px`;
  }

  onSvgRootPointerDown(event) {
    this.lastClientX = event.clientX;
    this.lastClientY = event.clientY;
    this.canvasAnchor.style.display = 'none';
    this.contextMenu.classList.remove('open');
    this.canvasRoot.style.cursor = 'grabbing';
    event.target.setPointerCapture(event.pointerId);
  }

  onSvgRootPointerMove(event) {
    if (this.canvasRoot.style.cursor === 'grabbing') {
      const [viewboxX, viewboxY] = this.translateClientToViewbox(this.lastClientX - event.clientX, this.lastClientY - event.clientY);
      this.canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${this.canvasRoot.viewBox.baseVal.width} ${this.canvasRoot.viewBox.baseVal.height}`);
      this.lastClientX = event.clientX;
      this.lastClientY = event.clientY;
    } else if (this.canvasRoot.style.cursor === 'crosshair') {
      if (this.canvasRoot.lastChild.nodeName === 'line') {
        const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
        this.canvasRoot.lastChild.setAttribute('x2', viewboxX);
        this.canvasRoot.lastChild.setAttribute('y2', viewboxY);
      }
    }
  }

  onSvgRootPointerUp(event) {
    if (this.canvasRoot.style.cursor === 'grabbing') {
      this.canvasRoot.style.cursor = 'grab';
      event.target.releasePointerCapture(event.pointerId);
    } else if (this.canvasRoot.style.cursor === 'crosshair') {
      if (this.canvasRoot.lastChild.nodeName === 'line') {
        this.canvasRoot.style.cursor = 'grab';
      }
    }
  }

  onSvgRootWheel(event) {
    const scale = 2 ** (event.deltaY / 10);
    const viewboxWidth = Math.max(10, Math.min(window.innerWidth, this.canvasRoot.viewBox.baseVal.width * scale));
    const viewboxHeight = this.canvasRoot.viewBox.baseVal.height / this.canvasRoot.viewBox.baseVal.width * viewboxWidth;
    const viewboxX = this.canvasRoot.viewBox.baseVal.x - (event.clientX / window.innerWidth * (viewboxWidth - this.canvasRoot.viewBox.baseVal.width));
    const viewboxY = this.canvasRoot.viewBox.baseVal.y - (event.clientY / window.innerHeight * (viewboxHeight - this.canvasRoot.viewBox.baseVal.height));
  
    this.canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${viewboxWidth} ${viewboxHeight}`);
  }

  onContextMenuClick() {
    this.canvasAnchor.style.display = 'none';
    this.contextMenu.classList.remove('open');
  }

  onAddLineClick(event) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
    
    line.setAttribute('x1', this.canvasAnchor.getAttribute('cx'));
    line.setAttribute('y1', this.canvasAnchor.getAttribute('cy'));
    line.setAttribute('x2', viewboxX);
    line.setAttribute('y2', viewboxY);
    line.setAttribute('stroke', 'black');
    this.canvasRoot.append(line);
    this.canvasRoot.style.cursor = 'crosshair';
  }

  onResetViewportClick() {
    const viewboxX = window.innerWidth / -2;
    const viewboxY = window.innerHeight / -2;
    const viewboxWidth = window.innerWidth;
    const viewboxHeight = window.innerHeight;
  
    this.canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${viewboxWidth} ${viewboxHeight}`);
  }

  translateClientToViewbox(clientX, clientY) {
    const viewboxX = this.canvasRoot.viewBox.baseVal.width / window.innerWidth * clientX + this.canvasRoot.viewBox.baseVal.x;
    const viewboxY = this.canvasRoot.viewBox.baseVal.height / window.innerHeight * clientY + this.canvasRoot.viewBox.baseVal.y;

    return [viewboxX, viewboxY];
  }
}
