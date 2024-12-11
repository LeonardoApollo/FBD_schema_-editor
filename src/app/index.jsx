import {
    Graph, 
    InternalEvent, 
    CellState, 
    Geometry,
    VertexHandler, 
    UndoManager, 
    getDefaultPlugins,
    ConnectionHandler, 
    MaxToolbar, 
    GraphDataModel, 
    SelectionHandler,
    DragSource, 
    cellArrayUtils, 
    gestureUtils,
    RubberBandHandler, 
    CellEditorHandler, 
    constants, 
    GraphView, 
    EdgeHandler
} from '@maxgraph/core';
import {useEffect, useRef, useState, useCallback} from 'react';
import generatePorts from './utils/generatePorts';
import generateFigure from './utils/generateFigure';
import ConnectionPreview from './components/ConnectionPreview';
import Dialog from './components/Dialog';
import TestScript from './test/testscript';
import generateCell from './utils/generateCell';


// Расширение стандартного метода ConnectionHandler.connect для валидации создания связей
const initConnect = ConnectionHandler.prototype.connect
ConnectionHandler.prototype.connect = function(source, target, evt, droptarget) {
    if(!target || target.parent.mxObjectId === source.parent.mxObjectId || target.geometry.x === source.geometry.x) return

    return initConnect.apply(this, arguments)
}

// Расширение пла плагина RubberBandHandler, чтобы он не срабатывал при нажатии на ПКМ
const initMouseDownRubber = RubberBandHandler.prototype.mouseDown
RubberBandHandler.prototype.mouseDown = function(sender, me) {
    this.enabled = me.evt.button !== 2
    return initMouseDownRubber.apply(this, arguments)
}

// Убирает точки воздействия для изменения размера ячейки
VertexHandler.prototype.isSizerVisible = function(index) {
    return false
}

// Предотвращает перетаскивание выделенной ячейки при нажатии ПКМ
const initMouseDownSelection = SelectionHandler.prototype.mouseDown
SelectionHandler.prototype.mouseDown = function(sender, me) {
    if(me.evt.button === 2) return
    return initMouseDownSelection.apply(this, arguments)
}

// Отключает возможность вставлять ячейки друг в друга
SelectionHandler.prototype.isValidDropTarget = function(cell, me) {
    return false
}

export default function App () {
    const graphContianerRef = useRef(null)
    const [graphState, setGraphState] = useState(null)

    const toolbarContainerRef = useRef(null)
    const [toolbarState, setToolbarState] = useState(null)

    const [cellsState, setCellsState] = useState([]);
    const ctrlKeyRef = useRef(null);
    // Здесь временно хранятся скопированные ячейки
    const copiedCells = [];
    let _init = true;
    const scriptTree = {};
    let currMethod = '';
    Object.entries(TestScript).map(([name, fn]) => fn.toString().split('\n').forEach((line, idx) => {
        if(idx == 0) {
            const name = line.replace(/\W/g, '')
            currMethod = name
            scriptTree[currMethod] = []
        } else {
            scriptTree[currMethod].push(line.trim());
        }
    }))
    function addCellImage(graph, toolbar, icon, w, h, type, style) {
        let cell;
        _init = true
        switch(type) {
            case'start':
                cell = generateFigure(graph,w,h, 'START', null, style)
                generatePorts(graph, cell, 0, 1, null)
                break
            case'end':
                cell = generateFigure(graph, w, h, 'END', null, style)
                generatePorts(graph, cell, 1, 0, null)
                break
            case'SR':
                cell = generateFigure(graph, w, h, 'SR', 'SR0', style)
                generatePorts(graph, cell, 3, 2, {leftport1: 'EN', leftport2: 'S1', leftport3: 'R', rightport1: 'ENO', rightport2: 'Q1'})
                break
            case'AND':
                cell = generateFigure(graph, w, h, 'AND', null, style)
                generatePorts(graph, cell, 2, 1, {leftport1: 'IN1', leftport2: 'IN2', rightport1: 'OUT'})
                break
            case'TP':
                cell = generateFigure(graph, w, h, 'TP', 'TP0', style)
                generatePorts(graph, cell, 2, 2, {leftport1: 'IN', leftport2: 'PT', rightport1: 'Q', rightport2: 'ET'})
                break
            default:
                throw Error('Unsupported figure type')
        }
        addToolbarItem(graph, toolbar, cell, icon, undefined);
    }

    const addToolbarItem = useCallback((graph, toolbar, prototype, image, title, style) => {
        const funct = (graph, evt, cell) => {
            const pt = graph.getPointForEvent(evt);
            const cellToImport = cellArrayUtils.cloneCell(prototype);
            if (!cellToImport) return;
            if (cellToImport.geometry) {
                cellToImport.geometry.x = pt.x;
                cellToImport.geometry.y = pt.y;
            }
            graph.setSelectionCells(graph.importCells([cellToImport], 0, 0, cell));
            _init = false
        };
        let img;
        if(typeof image === 'string') {
            img = toolbar.addMode(title, image, funct, '');
            gestureUtils.makeDraggable(img, graph, funct);
        } else {
            toolbarContainerRef.current.appendChild(image)
            toolbar.addItem('',null, () => {
                const cell = graph.importCell(prototype)
                graph.addCell(cell)
            })
            gestureUtils.makeDraggable(image, graph, funct);
        } 
    }, [])

    useEffect(() => {
        const graphContainer = graphContianerRef.current

        // Создание тулбара внешний вид настраивается стилем .mxToolbarMode
        const toolbar = new MaxToolbar(toolbarContainerRef.current)
        toolbar.enabled = false
        setToolbarState(toolbar)
        // Убираем стандартное контекстное меню и добавляем стандартные плагины
        InternalEvent.disableContextMenu(graphContainer)
        const plugins = getDefaultPlugins();

        // Создание модели и графа
        const model = new GraphDataModel();
        const graph = new Graph(graphContainer, model, [CellEditorHandler, ...plugins, RubberBandHandler])
        setGraphState(graph)
        // Запрещает отрывание линий от источника и цели
        graph.setAllowDanglingEdges(false);

        // Запрещает изменение размера ячеек
        graph.setCellsResizable(false)

        // Отслеживание изменений в графе
        const handleGraphChange = (e) => {
            if(!_init) {
                const cells = graph.getChildCells(graph.getDefaultParent());
                setCellsState(cells)
            }
        }

        // Отвечает за огибание линиями ячеек
        EdgeHandler.prototype.snapToTerminals = true;
        ConnectionHandler.prototype.movePreviewAway = false;
        graph.disconnectOnMove = false;
        graph.options.foldingEnabled = false;
        graph.cellsResizable = false;
        graph.extendParents = false;
        graph.setConnectable(true);
        graph.view.updateFixedTerminalPoint = function (edge, terminal, source, constraint) {
                GraphView.prototype.updateFixedTerminalPoint.apply(this, arguments);
                const pts = edge.absolutePoints;
                const pt = pts[source ? 0 : pts.length - 1];
                if (terminal != null && pt == null && this.getPerimeterFunction(terminal) == null) {
                  edge.setAbsoluteTerminalPoint(new Point(this.getRoutingCenterX(terminal), this.getRoutingCenterY(terminal)), source);
                }
        };
        graph.addListener(InternalEvent.CELLS_MOVED, (sender, evt) => {
            const cells = evt.properties?.cells || []
            if(cells.length) {
                cells.forEach(cell => {
                    cell.children?.forEach(port => {
                        port.edges?.forEach(edge => {
                            const geometry = edge.getGeometry();
                            geometry.points = null
                            edge.setGeometry(geometry)
                        })
                    })
                })
            }
            graph.refresh()
        })
        
        // UNDO/REDO
        const undoManager = new UndoManager();
        const listener = function (sender, e) {
            undoManager.undoableEditHappened(e.getProperty('edit'));
        };
        graph.getDataModel().addListener(InternalEvent.UNDO, listener);
        graph.getView().addListener(InternalEvent.UNDO, listener);
        // Делает возможным редактирование лейблы в фигурах
        graph.setCellsEditable(true)

        // Делает возможным редактирование относительно спозиционированных лейблов
        graph.isCellLocked = function (cell) {
            return this.isCellsLocked();
        };
        // Запрещает удаление отсносительных ячеек
        graph.isCellDeletable = function (cell) {
            const geo = cell.getGeometry();
            return geo == null || !geo.relative;
        }

        // При слишком длинном названии лейбла сокращает его чтобы поместить в ячейку 
        graph.getLabel = function (cell) {
            const label = this.labelsVisible ? this.convertValueToString(cell) : '';
            const geometry = cell.getGeometry();
            if (!cell.isCollapsed() && geometry != null && (geometry.offset == null || geometry.offset.x == 0 && geometry.offset.y == 0) && cell.isVertex() && geometry.width >= 2) {
                const style = this.getCellStyle(cell);
                const fontSize = style.fontSize || constants.DEFAULT_FONTSIZE;
                const max = geometry.width / (fontSize * 0.625);
                if (max < label.length) {
                    return `${label.substring(0, max)}...`;
                }
            }
            return label;
        };

        // Активируем возможноть дропа в граф
        graph.dropEnabled = true;

        // Настройка стиля соединений
        const style = graph.getStylesheet().getDefaultEdgeStyle();
        delete style.endArrow;
        style.shadowColor = '#C0C0C0';
        style.strokeColor = '#000000';
        style.strokeWidth = 1;
        style.fontColor = '#000000';
        style.fillColor = '#FFFFFF';
        style.labelBackgroundColor = '#FFFFFF'
        style.edgeStyle = 'orthogonalEdgeStyle'

        const connectionHandler = graph.getPlugin('ConnectionHandler');

        // Предпросмотр соединения
        connectionHandler.createEdgeState = function (me) {
            let edge = graph.createEdge();
            return  new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
        };

        // Настраиваем возможность создания соединений и возможность соединений соединяться между собой
        graph.setConnectable(true);
        graph.setConnectableEdges(false);

        // Отключает подсказки при наведение на соединение
        graph.setTooltips(false);

        graph.isCellFoldable = _cell => false;

        // Предотвращает перетаскивание соединений
        graph.isCellMovable = function(cell){
            if(cell.geometry?.relative) return false
            return !cell.isEdge()
        }

        DragSource.prototype.getDropTarget = function (graph, x, y, _evt) {
            let cell = graph.getCellAt(x, y);
            if (cell && !graph.isValidDropTarget(cell)) {
              cell = null;
            }
            return cell;
        };

        const handleKeyPress = (e) => {
            const isMac = navigator.userAgent.indexOf('Macintosh') !== -1 || navigator.userAgent.indexOf('Mac OS X') !== -1;
            ctrlKeyRef.current = isMac ? e.metaKey : e.ctrlKey;
            handleDelete(e)
            handleCopyCells(e, ctrlKeyRef.current)
            handleUndo(e, ctrlKeyRef.current)
        }

        const handleUndo = (e, ctrlKey) => {
            if(ctrlKey && e.keyCode === 90) {
                undoManager.undo();
                handleGraphChange()
                e.preventDefault();
            } 
            if(ctrlKey && e.keyCode === 89) {
                undoManager.redo();
                handleGraphChange()
                e.preventDefault();
            }
        }

        const editorHadler = graph.getPlugin('CellEditorHandler')
        const handleDelete = (e) => {
            if(e.key === 'Backspace' && !editorHadler.editingCell) {
                const cells = graph.getSelectionCells();
                cells.forEach(cell =>  {
                    if(!cell.connectable || cell.edge) {
                        graph.model.remove(cell)
                        graph.removeStateForCell(cell)
                        graph.removeCells([cell])
                    }
                })
                handleGraphChange()
            }
        }
        const handleCopyCells = (e ,isCtrlKey) => {
            // Проверка нажатия Ctrl + C
            if (isCtrlKey && e.keyCode === 67) { 
                const cells = graph.getSelectionCells(); 
                copiedCells.length = 0; 
                for (let i = 0; i < cells.length; i++) {
                    copiedCells.push(cells[i]); 
                }
                e.preventDefault();
            }
    
            // Проверка нажатия Ctrl + V
            if (isCtrlKey && e.keyCode === 86) { 
                if (copiedCells.length > 0) {
                    const parent = graph.getDefaultParent(); 
                    for (let i = 0; i < copiedCells.length; i++) {
                        // Дублируем каждую скопированную ячейку
                        const clone = graph.cloneCell(copiedCells[i]);
                        const cellGeometry = copiedCells[i].getGeometry(); 
                        // Изменяем позицию на 20 пикселей вправо и вниз для вставленной ячейки
                        if (cellGeometry && clone) {
                            console.log(copiedCells[i])
                            clone.setGeometry(new Geometry(cellGeometry.x + 20, cellGeometry.y + 20, cellGeometry.width, cellGeometry.height));
                        }
                        graph.setSelectionCells(graph.importCells([clone || copiedCells[i]], 0, 0, parent));
                    }
                }
                e.preventDefault();
            }
        }

        // Обновляет превью соединений при изменении лейблов ячеек
        graph.addListener(InternalEvent.EDITING_STOPPED, handleGraphChange)

        // Подключение событий клавиш
        InternalEvent.addListener(document, 'keydown', handleKeyPress)
        InternalEvent.addListener(document, 'keyup', (e) => {
            const isMac = navigator.userAgent.indexOf('Macintosh') !== -1 || navigator.userAgent.indexOf('Mac OS X') !== -1;
            if(isMac ? e.key === 'Meta' : e.key === 'Control') {
                ctrlKeyRef.current = null
            }
        })

        // Подключение события для зума
        InternalEvent.addMouseWheelListener((evt, up) => {
                if(ctrlKeyRef.current) {
                    let gridEnabled = graph.gridEnabled;
            
                    // disable snapping
                    graph.gridEnabled = false;
                    
                    let p1 = graph.getPointForEvent(evt, false);
                    
                    if (up) {
                        graph.zoomIn();
                    } else {
                        graph.zoomOut();
                    }
                    
                    let p2 = graph.getPointForEvent(evt, false);
                    let deltaX = p2.x - p1.x;
                    let deltaY = p2.y - p1.y;
                    let view = graph.view;
                    
                    view.setTranslate(view.translate.x + deltaX, view.translate.y + deltaY);
                    
                    graph.gridEnabled = gridEnabled;
                    view.validateBackgroundPage(); 
                    InternalEvent.consume(evt);
                }
        }, graphContainer)

        // Подключения события для перемещения по графу
        let isDragging = false;
        let lastMouseX, lastMouseY;
        const originalCursor = graph.container.style.cursor;
        InternalEvent.addListener(graph.container, 'mousedown', (e) => {
            if (e.button === 2) {
                isDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                graph.container.style.cursor = 'crosshair'; 
                e.preventDefault(); 
            }
        })
        InternalEvent.addListener(graph.container, 'mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastMouseX; 
                const dy = e.clientY - lastMouseY; 
        
                // Получаем текущий масштаб и сдвиг графа
                const scale = graph.view.scale; 
                const translate = graph.view.translate;
        
                // Обновляем сдвиг графа
                graph.view.setTranslate(translate.x - -dx / scale, translate.y - -dy / scale);
        
                // Обновляем последнюю позицию мыши
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                e.preventDefault()
            }
        })
        InternalEvent.addListener(graph.container, 'mouseup', (e) => {
            if (e.button === 2) { 
                isDragging = false;
                graph.container.style.cursor = originalCursor;
            } 
        })

        graph.addListener(InternalEvent.CELLS_ADDED, handleGraphChange)

        graph.addListener(InternalEvent.CELLS_REMOVED, handleGraphChange)

        // SR 
        addCellImage(graph,toolbar,'/SR.svg', 100, 60, 'SR', {editable: true});
        // Start
        addCellImage(graph,toolbar,'/start.svg', 60, 20, 'start', {editable: true});
        //End
        addCellImage(graph,toolbar,'/end.svg', 60, 20, 'end', {editable: true});
        //AND
        addCellImage(graph,toolbar,'/AND.svg', 100, 40, 'AND', {editable: true});
        // TP
        addCellImage(graph,toolbar,'/TP.svg', 100, 40, 'TP',  {editable: true});

        const parent = graph.getDefaultParent();
        const initialX = 10; 
        const initialY = 400;
        const offsetX = 100;
        const offsetY = 120;
        const blockPaddingX = 200;
        const blockPaddingY = 180;
        const blockOffsetX = 400;
        let currentX = initialX;
        let currentY = initialY;
        let currentBlockX = initialX;
        let currentBlockY = initialY
        console.log(scriptTree)
        const handleBlockGeometry = (cell, offsetX) => {
                const geometry = cell.getGeometry();
                geometry.x = currentBlockX
                geometry.y = currentBlockY
                currentX = currentBlockX - blockPaddingX
                currentY = currentBlockY - blockPaddingY
                cell.setGeometry(geometry)
                currentBlockX += offsetX || blockOffsetX;
                currentBlockY = initialY
        }
        const handleCellGeometry = (cell, rightSide) => {
            const geometry = cell.getGeometry();
            geometry.x = rightSide ? currentX + 400 : currentX + 50;
            geometry.y = currentY;
            cell.setGeometry(geometry)
            currentY += offsetY;
        }
        graph.batchUpdate(() => {
            const keys = Object.keys(scriptTree)
            let prevStep = null
            let transitionSide = null
            for(const key of keys) {
                if(key.indexOf('start') !== -1) {
                    const startPrototype = generateCell(graph, key);
                    const startCell = graph.importCells([startPrototype])[0];
                    handleBlockGeometry(startCell, offsetX)
                    prevStep = startCell
                }
                if(key.indexOf('step') !== -1) {
                    const stepPrototype = generateCell(graph, key)
                    const stepCell = graph.importCells([stepPrototype])[0];
                    let source;
                    if(prevStep) {
                        if(prevStep.value == 'start') source = prevStep.children[0]
                        if(prevStep.value.indexOf('step') !== -1) source = prevStep.children.find(child => child.value == 'FINISH')
                        if(transitionSide) {
                            source = prevStep.children.find(child => child.value === transitionSide)
                            transitionSide = null   
                        }
                    }
                    const target = stepCell.children.find(child => child.value == 'BEGIN')
                    graph.insertEdge(parent, null, '', source, target)
                    handleBlockGeometry(stepCell)
                    prevStep = stepCell
                    const devices = [];
                    scriptTree[key].forEach(code => {
                        const device = code.match(/const\s+([A-Z]\w+_\d+)/)
                        if(device) {
                            const devicePrototype = generateCell(graph, device[1])
                            const deviceCell = graph.importCells([devicePrototype])[0]
                            handleCellGeometry(deviceCell, true)
                            devices.push(deviceCell)
                        }
                        if(devices.length && code.indexOf('this')!== -1 ) {
                            // if(devices.findIndex((device) => device.value.indexOf))
                        }
                    })
                    
                }
                if(key.indexOf('transition') !== -1) {
                    let side = null;
                    const transitionPrototype = generateCell(graph, key)
                    const transitionCell = graph.importCells([transitionPrototype])[0];
                    let source;
                    if(prevStep && prevStep.value == 'start') {
                        source = prevStep.children[0]
                    } else if(prevStep && prevStep.value.indexOf('step') !== -1) {
                        source = prevStep.children.find(child => child.value == 'FINISH')
                    }
                    const target = transitionCell.children.find(child => child.value == 'Step')
                    graph.insertEdge(parent, null, '', source, target)
                    handleBlockGeometry(transitionCell)
                    prevStep = transitionCell
                    scriptTree[key].forEach((code) => {
                        const devices = code.match(/([A-Z]\w*\.\w+)/g)
                        if(code.indexOf('if') !== -1) side = 'true'
                        if(code.indexOf('else') !== -1) side = 'false'
                        if(devices) {
                            devices.forEach(device => {
                                const afterDot = device.split('.')
                                const prototype = generateCell(graph, device)
                                const cell = graph.importCells([prototype])[0]
                                const source = cell.children.find(child => child.value == afterDot[1])
                                const target = transitionCell.children.find(child => (!child.edges.length && child.value !== 'Step'))
                                graph.insertEdge(parent, null, '', source, target)
                                handleCellGeometry(cell)
                            })
                        }
                        if(side) {
                            if(code.indexOf('this.exit') !== -1) {
                                const endPrototype = generateCell(graph, 'exit');
                                const endCell = graph.importCells([endPrototype])[0];
                                const source = transitionCell.children.find(child => child.value === side)
                                const target =  endCell.children[0]
                                graph.insertEdge(parent, null, '', source, target)
                                handleCellGeometry(endCell, true)
                            }
                            if(code.indexOf('this.step') !== -1) {
                                transitionSide = side
                            }
                        }
                    })
                }
            }
            _init = false;
            handleGraphChange()
        })
       return () => {
        InternalEvent.removeAllListeners(document)
        graph.destroy()
        toolbar.destroy()
       }

    }, [])

    return (
        <>
            <div style={styles.root}>
                <div ref={toolbarContainerRef} style={styles.toolbar}/>
                <div style={styles.main}>
                    <div style={styles.container} ref={graphContianerRef} id='graph-container'/>
                </div>
                {cellsState && <ConnectionPreview cells={cellsState}/>}
            </div>
            <Dialog addToToolbar={addToolbarItem} graph={graphState} toolbar={toolbarState}/>
        </>
    )
}

const styles = {
    root: {
        display: 'flex',
        height: '100vh'
    },
    toolbar: {
        minWidth: '150px',
        maxHeight: 'calc(100vh - 50px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'scroll',
        gap: 10,
        flex: 0
    },
    main: {
        width: '100%',
        margin: '1px',
        border: '1px solid black'
    },
    container: {
        width: '100%',
        maxWidth: 'calc(100vw - 335px)',
        height: '100%',
        background: 'url(/grid.gif)',
        overflow: 'scroll'
    }
}