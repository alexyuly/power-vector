new class {
  constructor() {
    document.addEventListener('contextmenu', this.onDocumentContextMenu.bind(this));
    document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));

    const contextMenu = document.getElementById('context-menu');
    contextMenu.addEventListener('click', this.onContextMenuClick.bind(this));

    const contextMenuItemAddLine = document.getElementById('context-menu-item-add-line');
    contextMenuItemAddLine.addEventListener('click', this.onContextMenuItemAddLineClick.bind(this));

    const canvasRoot = document.getElementById('canvas-root');
    canvasRoot.addEventListener('contextmenu', this.onCanvasRootContextMenu.bind(this));
    canvasRoot.addEventListener('pointerdown', this.onCanvasRootPointerDown.bind(this));
    canvasRoot.addEventListener('pointermove', this.onCanvasRootPointerMove.bind(this));
    canvasRoot.addEventListener('pointerup', this.onCanvasRootPointerUp.bind(this));
    canvasRoot.addEventListener('wheel', this.onCanvasRootWheel.bind(this));
    canvasRoot.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

    this.elements = {
      canvasRoot,
      contextMenu,
      contextMenuAnchor: null,
      contextMenuItemAddLine,
      selection: null,
      selectionAnchors: null,
      selectionShadow: null,
    };

    this.state = {
      clientX: null,
      clientY: null,
    };
  }

  onDocumentContextMenu(event) {
    event.preventDefault();
  }

  onDocumentKeyDown(event) {
    if (event.key === 'Esc' || event.key === 'Escape') {
      const { canvasRoot, contextMenu, contextMenuAnchor } = this.elements;
      canvasRoot.style.removeProperty('cursor');
      contextMenu.style.display = 'none';
      contextMenuAnchor?.remove();
    }
  }

  onContextMenuClick() {
    const { contextMenu, contextMenuAnchor } = this.elements;
    contextMenu.style.display = 'none';
    contextMenuAnchor.remove();
  }

  onContextMenuItemAddLineClick(event) {
    const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
    const { canvasRoot, contextMenuAnchor } = this.elements;

    const selection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    selection.setAttribute('x1', contextMenuAnchor.getAttribute('cx'));
    selection.setAttribute('y1', contextMenuAnchor.getAttribute('cy'));
    selection.setAttribute('x2', viewboxX);
    selection.setAttribute('y2', viewboxY);
    selection.setAttribute('stroke', 'black');
    selection.setAttribute('stroke-width', 1);
    this.elements.selection = selection;

    const selectionShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    selectionShadow.setAttribute('x1', contextMenuAnchor.getAttribute('cx'));
    selectionShadow.setAttribute('y1', contextMenuAnchor.getAttribute('cy'));
    selectionShadow.setAttribute('x2', viewboxX);
    selectionShadow.setAttribute('y2', viewboxY);
    selectionShadow.setAttribute('stroke', 'transparent');
    selectionShadow.setAttribute('stroke-width', 5);
    this.elements.selectionShadow = selectionShadow;
    this.elements.selectionAnchors = [];

    const selectedElementAnchor1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectedElementAnchor1.setAttribute('cx', contextMenuAnchor.getAttribute('cx'));
    selectedElementAnchor1.setAttribute('cy', contextMenuAnchor.getAttribute('cy'));
    selectedElementAnchor1.setAttribute('r', 10);
    selectedElementAnchor1.setAttribute('fill', 'transparent');
    selectedElementAnchor1.setAttribute('stroke', 'transparent');
    selectedElementAnchor1.setAttribute('stroke-width', 5);
    this.elements.selectionAnchors.push(selectedElementAnchor1);

    const selectedElementAnchor2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectedElementAnchor2.setAttribute('cx', viewboxX);
    selectedElementAnchor2.setAttribute('cy', viewboxY);
    selectedElementAnchor2.setAttribute('r', 10);
    selectedElementAnchor2.setAttribute('fill', 'transparent');
    selectedElementAnchor2.setAttribute('stroke', 'transparent');
    selectedElementAnchor2.setAttribute('stroke-width', 5);
    selectedElementAnchor2.style.stroke = 'transparent'; // Temporarily disable anchor2 hover stroke while adding the line.
    this.elements.selectionAnchors.push(selectedElementAnchor2);

    const guiOnlyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    guiOnlyGroup.dataset.guiOnly = '';
    guiOnlyGroup.append(selectionShadow, selectedElementAnchor1, selectedElementAnchor2);

    canvasRoot.append(selection, guiOnlyGroup);
    canvasRoot.style.cursor = 'crosshair';
  }

  onCanvasRootContextMenu(event) {
    const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
    const { canvasRoot, contextMenu } = this.elements;

    contextMenu.style.display = 'initial';
    contextMenu.style.left = `${event.clientX - (contextMenu.offsetWidth < window.innerWidth - event.clientX ? 0 : contextMenu.offsetWidth)}px`;
    contextMenu.style.top = `${event.clientY - (contextMenu.offsetHeight < window.innerHeight - event.clientY ? 0 : contextMenu.offsetHeight)}px`;

    const contextMenuAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    contextMenuAnchor.setAttribute('cx', viewboxX);
    contextMenuAnchor.setAttribute('cy', viewboxY);
    contextMenuAnchor.setAttribute('r', 10);
    contextMenuAnchor.setAttribute('fill', 'transparent');
    contextMenuAnchor.setAttribute('stroke', '#6eddff');
    contextMenuAnchor.setAttribute('stroke-width', 5);
    this.elements.contextMenuAnchor = contextMenuAnchor;

    canvasRoot.append(contextMenuAnchor);
  }

  onCanvasRootPointerDown(event) {
    const { canvasRoot, contextMenu, contextMenuAnchor } = this.elements;
    canvasRoot.style.cursor = 'grabbing';
    contextMenu.style.display = 'none';
    contextMenuAnchor?.remove();
    this.state.clientX = event.clientX;
    this.state.clientY = event.clientY;
    event.target.setPointerCapture(event.pointerId);
  }

  onCanvasRootPointerMove(event) {
    const { canvasRoot } = this.elements;
    if (canvasRoot.style.cursor === 'grabbing') {
      const [viewboxX, viewboxY] = this.translateClientToViewbox(this.state.clientX - event.clientX, this.state.clientY - event.clientY);
      canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${canvasRoot.viewBox.baseVal.width} ${canvasRoot.viewBox.baseVal.height}`);
      this.state.clientX = event.clientX;
      this.state.clientY = event.clientY;
    } else if (canvasRoot.style.cursor === 'crosshair') {
      const { selection } = this.elements;
      if (selection?.nodeName === 'line') {
        const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
        const { selectionShadow, selectionAnchors } = this.elements;
        selection.setAttribute('x2', viewboxX);
        selection.setAttribute('y2', viewboxY);
        selectionShadow.setAttribute('x2', viewboxX);
        selectionShadow.setAttribute('y2', viewboxY);
        selectionAnchors[1].setAttribute('cx', viewboxX);
        selectionAnchors[1].setAttribute('cy', viewboxY);
      }
    }
  }

  onCanvasRootPointerUp(event) {
    const { canvasRoot } = this.elements;
    canvasRoot.style.removeProperty('cursor');
    this.state.clientX = null;
    this.state.clientY = null;
    event.target.releasePointerCapture(event.pointerId);

    const { selection } = this.elements;
    if (selection?.nodeName === 'line') {
      const { selectionAnchors } = this.elements;
      selectionAnchors[1].style.removeProperty('stroke');
      this.elements.selection = null;
      this.elements.selectionAnchors = null;
      this.elements.selectionShadow = null;
    }
  }

  onCanvasRootWheel(event) {
    const { canvasRoot } = this.elements;
    const scale = 2 ** (event.deltaY / 10);
    const viewboxWidth = Math.max(10, Math.min(window.innerWidth, canvasRoot.viewBox.baseVal.width * scale));
    const viewboxHeight = canvasRoot.viewBox.baseVal.height / canvasRoot.viewBox.baseVal.width * viewboxWidth;
    const viewboxX = canvasRoot.viewBox.baseVal.x - (event.clientX / window.innerWidth * (viewboxWidth - canvasRoot.viewBox.baseVal.width));
    const viewboxY = canvasRoot.viewBox.baseVal.y - (event.clientY / window.innerHeight * (viewboxHeight - canvasRoot.viewBox.baseVal.height));
  
    canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${viewboxWidth} ${viewboxHeight}`);
  }

  translateClientToViewbox(clientX, clientY) {
    const viewboxX = this.elements.canvasRoot.viewBox.baseVal.width / window.innerWidth * clientX + this.elements.canvasRoot.viewBox.baseVal.x;
    const viewboxY = this.elements.canvasRoot.viewBox.baseVal.height / window.innerHeight * clientY + this.elements.canvasRoot.viewBox.baseVal.y;

    return [viewboxX, viewboxY];
  }
}
