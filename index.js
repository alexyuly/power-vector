new class {
  constructor() {
    document.addEventListener('contextmenu', this.onDocumentContextMenu.bind(this));
    document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));

    const contextMenu = document.getElementById('context-menu');
    contextMenu.addEventListener('click', this.onContextMenuClick.bind(this));

    const contextMenuItemAddLine = document.getElementById('context-menu-item-add-line');
    contextMenuItemAddLine.addEventListener('click', this.onContextMenuItemAddLineClick.bind(this));

    const contextMenuItemAddRect = document.getElementById('context-menu-item-add-rect');
    contextMenuItemAddRect.addEventListener('click', this.onContextMenuItemAddRectClick.bind(this));

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
      selectionHandles: null,
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
      contextMenu.style.removeProperty('display');
      contextMenuAnchor?.remove();
    }
  }

  onContextMenuClick() {
    const { contextMenu, contextMenuAnchor } = this.elements;
    contextMenu.style.removeProperty('display');
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

    const selectionHandle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionHandle1.setAttribute('cx', contextMenuAnchor.getAttribute('cx'));
    selectionHandle1.setAttribute('cy', contextMenuAnchor.getAttribute('cy'));
    selectionHandle1.setAttribute('r', 10);
    selectionHandle1.setAttribute('fill', 'transparent');
    selectionHandle1.setAttribute('stroke', 'transparent');
    selectionHandle1.setAttribute('stroke-width', 5);

    const selectionHandle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionHandle2.setAttribute('cx', viewboxX);
    selectionHandle2.setAttribute('cy', viewboxY);
    selectionHandle2.setAttribute('r', 10);
    selectionHandle2.setAttribute('fill', 'transparent');
    selectionHandle2.setAttribute('stroke', 'transparent');
    selectionHandle2.setAttribute('stroke-width', 5);
    selectionHandle2.style.stroke = 'transparent'; // Temporarily disable anchor2 hover stroke while adding the line.

    selectionShadow.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionShadow.setPointerCapture(event.pointerId);
      selectionShadow.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2];
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
      selectionHandle1.setAttribute('cx', x1);
      selectionHandle1.setAttribute('cy', y1);
      selectionHandle2.setAttribute('cx', x2);
      selectionHandle2.setAttribute('cy', y2);
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

    selectionHandle1.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionHandle1.setPointerCapture(event.pointerId);
      selectionHandle1.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2];
    });

    selectionHandle1.addEventListener('pointermove', (event) => {
      if (selectionHandle1.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      selection.setAttribute('x1', viewboxX);
      selection.setAttribute('y1', viewboxY);
      selectionShadow.setAttribute('x1', viewboxX);
      selectionShadow.setAttribute('y1', viewboxY);
      selectionHandle1.setAttribute('cx', viewboxX);
      selectionHandle1.setAttribute('cy', viewboxY);
    });

    selectionHandle1.addEventListener('pointerup', (event) => {
      if (selectionHandle1.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionHandle1.releasePointerCapture(event.pointerId);
      selectionHandle1.style.removeProperty('cursor');
    });

    selectionHandle2.addEventListener('pointerdown', (event) => {
      if (canvasRoot.style.cursor === 'crosshair') {
        return;
      }
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionHandle2.setPointerCapture(event.pointerId);
      selectionHandle2.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2];
    });

    selectionHandle2.addEventListener('pointermove', (event) => {
      if (selectionHandle2.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      selection.setAttribute('x2', viewboxX);
      selection.setAttribute('y2', viewboxY);
      selectionShadow.setAttribute('x2', viewboxX);
      selectionShadow.setAttribute('y2', viewboxY);
      selectionHandle2.setAttribute('cx', viewboxX);
      selectionHandle2.setAttribute('cy', viewboxY);
    });

    selectionHandle2.addEventListener('pointerup', (event) => {
      if (selectionHandle2.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionHandle2.releasePointerCapture(event.pointerId);
      selectionHandle2.style.removeProperty('cursor');
    });

    this.elements.selection = selection;
    this.elements.selectionShadow = selectionShadow;
    this.elements.selectionHandles = [selectionHandle1, selectionHandle2];

    const guiOnlyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    guiOnlyGroup.dataset.guiOnly = '';
    guiOnlyGroup.append(selectionShadow, ...this.elements.selectionHandles);

    canvasRoot.append(selection, guiOnlyGroup);
    canvasRoot.style.cursor = 'crosshair';
  }

  onContextMenuItemAddRectClick(event) {
    const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
    const { canvasRoot, contextMenuAnchor } = this.elements;
    const anchorX = +contextMenuAnchor.getAttribute('cx');
    const anchorY = +contextMenuAnchor.getAttribute('cy');
    const x = viewboxX < anchorX ? viewboxX : anchorX;
    const y = viewboxY < anchorY ? viewboxY : anchorY;
    const width = Math.abs(viewboxX - anchorX);
    const height = Math.abs(viewboxY - anchorY);

    const selection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selection.setAttribute('x', x);
    selection.setAttribute('y', y);
    selection.setAttribute('width', width);
    selection.setAttribute('height', height);
    selection.setAttribute('fill', 'none');
    selection.setAttribute('stroke', 'black');
    selection.setAttribute('stroke-width', 1);

    const selectionShadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selectionShadow.setAttribute('x', x);
    selectionShadow.setAttribute('y', y);
    selectionShadow.setAttribute('width', width);
    selectionShadow.setAttribute('height', height);
    selectionShadow.setAttribute('fill', 'none');
    selectionShadow.setAttribute('stroke', 'transparent');
    selectionShadow.setAttribute('stroke-width', 5);

    const selectionHandle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionHandle1.setAttribute('cx', viewboxX);
    selectionHandle1.setAttribute('cy', anchorY);
    selectionHandle1.setAttribute('r', 10);
    selectionHandle1.setAttribute('fill', 'transparent');
    selectionHandle1.setAttribute('stroke', 'transparent');
    selectionHandle1.setAttribute('stroke-width', 5);

    const selectionHandle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionHandle2.setAttribute('cx', anchorX);
    selectionHandle2.setAttribute('cy', viewboxY);
    selectionHandle2.setAttribute('r', 10);
    selectionHandle2.setAttribute('fill', 'transparent');
    selectionHandle2.setAttribute('stroke', 'transparent');
    selectionHandle2.setAttribute('stroke-width', 5);

    const selectionHandle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionHandle3.setAttribute('cx', anchorX);
    selectionHandle3.setAttribute('cy', anchorY);
    selectionHandle3.setAttribute('r', 10);
    selectionHandle3.setAttribute('fill', 'transparent');
    selectionHandle3.setAttribute('stroke', 'transparent');
    selectionHandle3.setAttribute('stroke-width', 5);

    const selectionHandle4 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionHandle4.setAttribute('cx', viewboxX);
    selectionHandle4.setAttribute('cy', viewboxY);
    selectionHandle4.setAttribute('r', 10);
    selectionHandle4.setAttribute('fill', 'transparent');
    selectionHandle4.setAttribute('stroke', 'transparent');
    selectionHandle4.setAttribute('stroke-width', 5);
    selectionHandle4.style.stroke = 'transparent'; // Temporarily disable anchor4 hover stroke while adding the rect.

    selectionShadow.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionShadow.setPointerCapture(event.pointerId);
      selectionShadow.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      selectionHandle3.dataset.selected = '';
      selectionHandle4.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2, selectionHandle3, selectionHandle4];
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
      const x = +selection.getAttribute('x') - viewboxX;
      const y = +selection.getAttribute('y') - viewboxY;
      const width = +selection.getAttribute('width');
      const height = +selection.getAttribute('height');
      selection.setAttribute('x', x);
      selection.setAttribute('y', y);
      selectionShadow.setAttribute('x', x);
      selectionShadow.setAttribute('y', y);
      selectionHandle1.setAttribute('cx', x + width);
      selectionHandle1.setAttribute('cy', y);
      selectionHandle2.setAttribute('cx', x);
      selectionHandle2.setAttribute('cy', y + height);
      selectionHandle3.setAttribute('cx', x);
      selectionHandle3.setAttribute('cy', y);
      selectionHandle4.setAttribute('cx', x + width);
      selectionHandle4.setAttribute('cy', y + height);
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

    selectionHandle1.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionHandle1.setPointerCapture(event.pointerId);
      selectionHandle1.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      selectionHandle3.dataset.selected = '';
      selectionHandle4.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2, selectionHandle3, selectionHandle4];
    });

    selectionHandle1.addEventListener('pointermove', (event) => {
      if (selectionHandle1.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      const isLeftHand = viewboxX < selectionHandle3.getAttribute('cx');
      const isUpperHand = viewboxY < selectionHandle4.getAttribute('cy');
      const x = isLeftHand ? viewboxX : +selectionHandle2.getAttribute('cx');
      const y = isUpperHand ? viewboxY : +selectionHandle2.getAttribute('cy');
      const width = Math.abs(+selectionHandle2.getAttribute('cx') - viewboxX);
      const height = Math.abs(+selectionHandle2.getAttribute('cy') - viewboxY);
      selection.setAttribute('x', x);
      selection.setAttribute('y', y);
      selection.setAttribute('width', width);
      selection.setAttribute('height', height);
      selectionShadow.setAttribute('x', x);
      selectionShadow.setAttribute('y', y);
      selectionShadow.setAttribute('width', width);
      selectionShadow.setAttribute('height', height);
      selectionHandle3.setAttribute('cy', viewboxY);
      selectionHandle4.setAttribute('cx', viewboxX);
      selectionHandle1.setAttribute('cx', viewboxX);
      selectionHandle1.setAttribute('cy', viewboxY);
    });

    selectionHandle1.addEventListener('pointerup', (event) => {
      if (selectionHandle1.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionHandle1.releasePointerCapture(event.pointerId);
      selectionHandle1.style.removeProperty('cursor');
    });

    selectionHandle2.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionHandle2.setPointerCapture(event.pointerId);
      selectionHandle2.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      selectionHandle3.dataset.selected = '';
      selectionHandle4.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2, selectionHandle3, selectionHandle4];
    });

    selectionHandle2.addEventListener('pointermove', (event) => {
      if (selectionHandle2.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      const isLeftHand = viewboxX < selectionHandle4.getAttribute('cx');
      const isUpperHand = viewboxY < selectionHandle3.getAttribute('cy');
      const x = isLeftHand ? viewboxX : +selectionHandle1.getAttribute('cx');
      const y = isUpperHand ? viewboxY : +selectionHandle1.getAttribute('cy');
      const width = Math.abs(+selectionHandle1.getAttribute('cx') - viewboxX);
      const height = Math.abs(+selectionHandle1.getAttribute('cy') - viewboxY);
      selection.setAttribute('x', x);
      selection.setAttribute('y', y);
      selection.setAttribute('width', width);
      selection.setAttribute('height', height);
      selectionShadow.setAttribute('x', x);
      selectionShadow.setAttribute('y', y);
      selectionShadow.setAttribute('width', width);
      selectionShadow.setAttribute('height', height);
      selectionHandle3.setAttribute('cx', viewboxX);
      selectionHandle4.setAttribute('cy', viewboxY);
      selectionHandle2.setAttribute('cx', viewboxX);
      selectionHandle2.setAttribute('cy', viewboxY);
    });

    selectionHandle2.addEventListener('pointerup', (event) => {
      if (selectionHandle2.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionHandle2.releasePointerCapture(event.pointerId);
      selectionHandle2.style.removeProperty('cursor');
    });

    selectionHandle3.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionHandle3.setPointerCapture(event.pointerId);
      selectionHandle3.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      selectionHandle3.dataset.selected = '';
      selectionHandle4.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2, selectionHandle3, selectionHandle4];
    });

    selectionHandle3.addEventListener('pointermove', (event) => {
      if (selectionHandle3.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      const isLeftHand = viewboxX < selectionHandle1.getAttribute('cx');
      const isUpperHand = viewboxY < selectionHandle2.getAttribute('cy');
      const x = isLeftHand ? viewboxX : +selectionHandle4.getAttribute('cx');
      const y = isUpperHand ? viewboxY : +selectionHandle4.getAttribute('cy');
      const width = Math.abs(+selectionHandle4.getAttribute('cx') - viewboxX);
      const height = Math.abs(+selectionHandle4.getAttribute('cy') - viewboxY);
      selection.setAttribute('x', x);
      selection.setAttribute('y', y);
      selection.setAttribute('width', width);
      selection.setAttribute('height', height);
      selectionShadow.setAttribute('x', x);
      selectionShadow.setAttribute('y', y);
      selectionShadow.setAttribute('width', width);
      selectionShadow.setAttribute('height', height);
      selectionHandle1.setAttribute('cy', viewboxY);
      selectionHandle2.setAttribute('cx', viewboxX);
      selectionHandle3.setAttribute('cx', viewboxX);
      selectionHandle3.setAttribute('cy', viewboxY);
    });

    selectionHandle3.addEventListener('pointerup', (event) => {
      if (selectionHandle3.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionHandle3.releasePointerCapture(event.pointerId);
      selectionHandle3.style.removeProperty('cursor');
    });

    selectionHandle4.addEventListener('pointerdown', (event) => {
      if (canvasRoot.style.cursor === 'crosshair') {
        return;
      }
      event.stopPropagation();
      delete this.elements.selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      selectionHandle4.setPointerCapture(event.pointerId);
      selectionHandle4.style.cursor = 'move';
      selectionShadow.dataset.selected = '';
      selectionHandle1.dataset.selected = '';
      selectionHandle2.dataset.selected = '';
      selectionHandle3.dataset.selected = '';
      selectionHandle4.dataset.selected = '';
      this.elements.selection = selection;
      this.elements.selectionShadow = selectionShadow;
      this.elements.selectionHandles = [selectionHandle1, selectionHandle2, selectionHandle3, selectionHandle4];
    });

    selectionHandle4.addEventListener('pointermove', (event) => {
      if (selectionHandle4.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      const isLeftHand = viewboxX < selectionHandle2.getAttribute('cx');
      const isUpperHand = viewboxY < selectionHandle1.getAttribute('cy');
      const x = isLeftHand ? viewboxX : +selectionHandle3.getAttribute('cx');
      const y = isUpperHand ? viewboxY : +selectionHandle3.getAttribute('cy');
      const width = Math.abs(+selectionHandle3.getAttribute('cx') - viewboxX);
      const height = Math.abs(+selectionHandle3.getAttribute('cy') - viewboxY);
      selection.setAttribute('x', x);
      selection.setAttribute('y', y);
      selection.setAttribute('width', width);
      selection.setAttribute('height', height);
      selectionShadow.setAttribute('x', x);
      selectionShadow.setAttribute('y', y);
      selectionShadow.setAttribute('width', width);
      selectionShadow.setAttribute('height', height);
      selectionHandle1.setAttribute('cx', viewboxX);
      selectionHandle2.setAttribute('cy', viewboxY);
      selectionHandle4.setAttribute('cx', viewboxX);
      selectionHandle4.setAttribute('cy', viewboxY);
    });

    selectionHandle4.addEventListener('pointerup', (event) => {
      if (selectionHandle4.style.cursor !== 'move') {
        return;
      }
      event.stopPropagation();
      selectionHandle4.releasePointerCapture(event.pointerId);
      selectionHandle4.style.removeProperty('cursor');
    });

    this.elements.selection = selection;
    this.elements.selectionShadow = selectionShadow;
    this.elements.selectionHandles = [selectionHandle1, selectionHandle2, selectionHandle3, selectionHandle4];

    const guiOnlyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    guiOnlyGroup.dataset.guiOnly = '';
    guiOnlyGroup.append(selectionShadow, ...this.elements.selectionHandles);

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
    const { canvasRoot, contextMenu, contextMenuAnchor, selectionHandles, selectionShadow } = this.elements;

    if (canvasRoot.style.cursor !== 'crosshair') {
      delete selectionShadow?.dataset.selected;
      this.elements.selectionHandles?.forEach(el => { delete el.dataset.selected; });
      this.elements.selection = null;
      this.elements.selectionShadow = null;
      this.elements.selectionHandles = null;
    }

    canvasRoot.setPointerCapture(event.pointerId);
    canvasRoot.style.cursor = 'grabbing';
    contextMenu.style.removeProperty('display');
    contextMenuAnchor?.remove();
    this.state.clientX = event.clientX;
    this.state.clientY = event.clientY;
  }

  onCanvasRootPointerMove(event) {
    const { canvasRoot, contextMenuAnchor } = this.elements;

    if (canvasRoot.style.cursor === 'grabbing') {
      const [viewboxX, viewboxY] = this.translateClientToViewbox(this.state.clientX - event.clientX, this.state.clientY - event.clientY);
      canvasRoot.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${canvasRoot.viewBox.baseVal.width} ${canvasRoot.viewBox.baseVal.height}`);
      this.state.clientX = event.clientX;
      this.state.clientY = event.clientY;
    } else if (canvasRoot.style.cursor === 'crosshair') {
      const { selection, selectionHandles, selectionShadow } = this.elements;
      const [viewboxX, viewboxY] = this.translateClientToViewbox(event.clientX, event.clientY);
      if (selection?.nodeName === 'line') {
        selection.setAttribute('x2', viewboxX);
        selection.setAttribute('y2', viewboxY);
        selectionShadow.setAttribute('x2', viewboxX);
        selectionShadow.setAttribute('y2', viewboxY);
        selectionHandles[1].setAttribute('cx', viewboxX);
        selectionHandles[1].setAttribute('cy', viewboxY);
      } else if (selection?.nodeName === 'rect') {
        const anchorX = +contextMenuAnchor.getAttribute('cx');
        const anchorY = +contextMenuAnchor.getAttribute('cy');
        const x = viewboxX < anchorX ? viewboxX : anchorX;
        const y = viewboxY < anchorY ? viewboxY : anchorY;
        const width = Math.abs(viewboxX - anchorX);
        const height = Math.abs(viewboxY - anchorY);
        selection.setAttribute('x', x);
        selection.setAttribute('y', y);
        selection.setAttribute('width', width);
        selection.setAttribute('height', height);
        selectionShadow.setAttribute('x', x);
        selectionShadow.setAttribute('y', y);
        selectionShadow.setAttribute('width', width);
        selectionShadow.setAttribute('height', height);
        selectionHandles[0].setAttribute('cx', viewboxX);
        selectionHandles[1].setAttribute('cy', viewboxY);
        selectionHandles[3].setAttribute('cx', viewboxX);
        selectionHandles[3].setAttribute('cy', viewboxY);
      }
    }
  }

  onCanvasRootPointerUp(event) {
    const { canvasRoot, selection, selectionHandles, selectionShadow } = this.elements;
    canvasRoot.releasePointerCapture(event.pointerId);
    canvasRoot.style.removeProperty('cursor');
    this.state.clientX = null;
    this.state.clientY = null;

    if (selection?.nodeName === 'line') {
      selectionShadow.dataset.selected = '';
      selectionHandles.forEach(el => { el.dataset.selected = ''; });
      selectionHandles[1].style.removeProperty('stroke');
    } else if (selection?.nodeName === 'rect') {
      selectionShadow.dataset.selected = '';
      selectionHandles.forEach(el => { el.dataset.selected = ''; });
      selectionHandles[3].style.removeProperty('stroke');
    }
  }

  onCanvasRootWheel(event) {
    const { canvasRoot } = this.elements;
    const scale = 2 ** (event.deltaY / 10);
    const viewboxWidth = Math.max(10, Math.min(Math.max(10000, window.innerWidth), canvasRoot.viewBox.baseVal.width * scale));
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
