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

    const selectionShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    selectionShadow.setAttribute('x1', contextMenuAnchor.getAttribute('cx'));
    selectionShadow.setAttribute('y1', contextMenuAnchor.getAttribute('cy'));
    selectionShadow.setAttribute('x2', viewboxX);
    selectionShadow.setAttribute('y2', viewboxY);
    selectionShadow.setAttribute('stroke', 'transparent');
    selectionShadow.setAttribute('stroke-width', 5);

    const selectedElementAnchor1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectedElementAnchor1.setAttribute('cx', contextMenuAnchor.getAttribute('cx'));
    selectedElementAnchor1.setAttribute('cy', contextMenuAnchor.getAttribute('cy'));
    selectedElementAnchor1.setAttribute('r', 10);
    selectedElementAnchor1.setAttribute('fill', 'transparent');
    selectedElementAnchor1.setAttribute('stroke', 'transparent');
    selectedElementAnchor1.setAttribute('stroke-width', 5);

    const selectedElementAnchor2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectedElementAnchor2.setAttribute('cx', viewboxX);
    selectedElementAnchor2.setAttribute('cy', viewboxY);
    selectedElementAnchor2.setAttribute('r', 10);
    selectedElementAnchor2.setAttribute('fill', 'transparent');
    selectedElementAnchor2.setAttribute('stroke', 'transparent');
    selectedElementAnchor2.setAttribute('stroke-width', 5);
    selectedElementAnchor2.style.stroke = 'transparent'; // Temporarily disable anchor2 hover stroke while adding the line.

    selectionShadow.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      delete this.elements.selectionAnchors?.[0].dataset.selected;
      delete this.elements.selectionAnchors?.[1].dataset.selected;
      selectionShadow.setPointerCapture(event.pointerId);
      selectionShadow.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectedElementAnchor1.dataset.selected = '';
      selectedElementAnchor2.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionAnchors = [selectedElementAnchor1, selectedElementAnchor2];
      this.state.clientX = event.clientX;
      this.state.clientY = event.clientY;
    });

    selectionShadow.addEventListener('pointermove', (event) => {
      if (selectionShadow.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const viewboxX = canvasRoot.viewBox.baseVal.width / window.innerWidth * (this.state.clientX - event.clientX);
      const viewboxY = canvasRoot.viewBox.baseVal.height / window.innerHeight * (this.state.clientY - event.clientY);
      const x1 = +selection.getAttribute('x1') - viewboxX;
      const y1 = +selection.getAttribute('y1') - viewboxY;
      const x2 = +selection.getAttribute('x2') - viewboxX;
      const y2 = +selection.getAttribute('y2') - viewboxY;
      selection.setAttribute('x1', x1);
      selection.setAttribute('y1', y1);
      selection.setAttribute('x2', x2);
      selection.setAttribute('y2', y2);
      selectionShadow.setAttribute('x1', x1);
      selectionShadow.setAttribute('y1', y1);
      selectionShadow.setAttribute('x2', x2);
      selectionShadow.setAttribute('y2', y2);
      selectedElementAnchor1.setAttribute('cx', x1);
      selectedElementAnchor1.setAttribute('cy', y1);
      selectedElementAnchor2.setAttribute('cx', x2);
      selectedElementAnchor2.setAttribute('cy', y2);
      this.state.clientX = event.clientX;
      this.state.clientY = event.clientY;
    });

    selectionShadow.addEventListener('pointerup', (event) => {
      if (selectionShadow.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionShadow.releasePointerCapture(event.pointerId);
      selectionShadow.style.removeProperty('cursor');
    });

    selectedElementAnchor1.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      delete this.elements.selectionAnchors?.[0].dataset.selected;
      delete this.elements.selectionAnchors?.[1].dataset.selected;
      selectedElementAnchor1.setPointerCapture(event.pointerId);
      selectedElementAnchor1.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectedElementAnchor1.dataset.selected = '';
      selectedElementAnchor2.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionAnchors = [selectedElementAnchor1, selectedElementAnchor2];
    });

    selectedElementAnchor1.addEventListener('pointermove', (event) => {
      if (selectedElementAnchor1.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      selection.setAttribute('x1', viewboxX);
      selection.setAttribute('y1', viewboxY);
      selectionShadow.setAttribute('x1', viewboxX);
      selectionShadow.setAttribute('y1', viewboxY);
      selectedElementAnchor1.setAttribute('cx', viewboxX);
      selectedElementAnchor1.setAttribute('cy', viewboxY);
    });

    selectedElementAnchor1.addEventListener('pointerup', (event) => {
      if (selectedElementAnchor1.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectedElementAnchor1.releasePointerCapture(event.pointerId);
      selectedElementAnchor1.style.removeProperty('cursor');
    });

    selectedElementAnchor2.addEventListener('pointerdown', (event) => {
      if (canvasRoot.style.cursor === 'crosshair') {
        return;
      }
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      delete this.elements.selectionAnchors?.[0].dataset.selected;
      delete this.elements.selectionAnchors?.[1].dataset.selected;
      selectedElementAnchor2.setPointerCapture(event.pointerId);
      selectedElementAnchor2.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectedElementAnchor1.dataset.selected = '';
      selectedElementAnchor2.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionAnchors = [selectedElementAnchor1, selectedElementAnchor2];
    });

    selectedElementAnchor2.addEventListener('pointermove', (event) => {
      if (selectedElementAnchor2.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      selection.setAttribute('x2', viewboxX);
      selection.setAttribute('y2', viewboxY);
      selectionShadow.setAttribute('x2', viewboxX);
      selectionShadow.setAttribute('y2', viewboxY);
      selectedElementAnchor2.setAttribute('cx', viewboxX);
      selectedElementAnchor2.setAttribute('cy', viewboxY);
    });

    selectedElementAnchor2.addEventListener('pointerup', (event) => {
      if (selectedElementAnchor2.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectedElementAnchor2.releasePointerCapture(event.pointerId);
      selectedElementAnchor2.style.removeProperty('cursor');
    });

    this.elements.selection = selection;
    this.elements.selectionShadow = selectionShadow;
    this.elements.selectionAnchors = [selectedElementAnchor1, selectedElementAnchor2];

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
    const { canvasRoot, contextMenu, contextMenuAnchor, selectionAnchors, selectionShadow } = this.elements;

    if (canvasRoot.style.cursor !== 'crosshair') {
      delete selectionShadow?.dataset.selected;
      delete selectionAnchors?.[0].dataset.selected;
      delete selectionAnchors?.[1].dataset.selected;
      this.elements.selection = null;
      this.elements.selectionShadow = null;
      this.elements.selectionAnchors = null;
    }

    canvasRoot.setPointerCapture(event.pointerId);
    canvasRoot.style.cursor = 'grabbing';
    contextMenu.style.display = 'none';
    contextMenuAnchor?.remove();
    this.state.clientX = event.clientX;
    this.state.clientY = event.clientY;
  }

  onCanvasRootPointerMove(event) {
    const { canvasRoot } = this.elements;

    if (canvasRoot.style.cursor === 'grabbing') {
      const [viewboxX, viewboxY] = this.translateClientToViewbox(this.state.clientX - event.clientX, this.state.clientY - event.clientY);
      canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${canvasRoot.viewBox.baseVal.width} ${canvasRoot.viewBox.baseVal.height}`);
      this.state.clientX = event.clientX;
      this.state.clientY = event.clientY;
    }
    else if (canvasRoot.style.cursor === 'crosshair') {
      const { selection, selectionAnchors, selectionShadow } = this.elements;
      if (selection?.nodeName === 'line') {
        const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
        selection.setAttribute('x2', viewboxX);
        selection.setAttribute('y2', viewboxY);
        selectionAnchors[1].setAttribute('cx', viewboxX);
        selectionAnchors[1].setAttribute('cy', viewboxY);
        selectionShadow.setAttribute('x2', viewboxX);
        selectionShadow.setAttribute('y2', viewboxY);
      }
    }
  }

  onCanvasRootPointerUp(event) {
    const { canvasRoot, selection, selectionAnchors, selectionShadow } = this.elements;
    canvasRoot.releasePointerCapture(event.pointerId);
    canvasRoot.style.removeProperty('cursor');
    this.state.clientX = null;
    this.state.clientY = null;

    if (selection?.nodeName === 'line') {
      selectionAnchors[0].dataset.selected = '';
      selectionAnchors[1].style.removeProperty('stroke');
      selectionAnchors[1].dataset.selected = '';
      selectionShadow.dataset.selected = '';
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
    const { canvasRoot } = this.elements;
    const viewboxX = canvasRoot.viewBox.baseVal.width / window.innerWidth * clientX + canvasRoot.viewBox.baseVal.x;
    const viewboxY = canvasRoot.viewBox.baseVal.height / window.innerHeight * clientY + canvasRoot.viewBox.baseVal.y;

    return [viewboxX, viewboxY];
  }
}
