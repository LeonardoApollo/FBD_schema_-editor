import {Graph, InternalEvent, EdgeStyle, CellState, Geometry, VertexHandler, UndoManager, getDefaultPlugins,ConnectionHandler, MaxToolbar, GraphDataModel, DragSource, cellArrayUtils, gestureUtils, RubberBandHandler, CellEditorHandler, constants, Point} from '@maxgraph/core';
import {useEffect, useRef, useState} from 'react';
import generatePorts from './utils/generatePorts';
import generateFigure from './utils/generateFigure';
import ConnectionPreview from './components/ConnectionPreview';
import Dialog from './components/Dialog';

// Расширение стандартного метода ConnectionHandler.connect для валидации создания связей
const initConnect = ConnectionHandler.prototype.connect
ConnectionHandler.prototype.connect = function(source, target, evt, droptarget) {
    if(!target || target.parent.mxObjectId === source.parent.mxObjectId || target.geometry.x === source.geometry.x) return

    return initConnect.apply(this, arguments)
}

// Расширение плаина RubberBandHandler, чтобы он не срабатывал при нажатии на ПКМ
const initMouseDown = RubberBandHandler.prototype.mouseDown
RubberBandHandler.prototype.mouseDown = function(sender, me) {
    this.enabled = me.evt.button !== 2
    return initMouseDown.apply(this, arguments)
}

// Убирает точки воздействия для изменения размера ячейки
VertexHandler.prototype.isSizerVisible = function(index) {
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

    function addToolbarItem(graph, toolbar, prototype, image, title, style) {
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
        const img = toolbar.addMode(title, image, funct, '');
        gestureUtils.makeDraggable(img, graph, funct);
    }

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
        // Запрещает изменения размера ячеек
        graph.isCellResizable = function (cell) {
            return false
        };

        // При слишком длинном названии лейбла сокращает его чтобы поместить в фигуру 
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
        style.edgeStyle = EdgeStyle.ElbowConnector

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
                graph.removeCells(cells);
            }
        }
        const handleCopyCells = (e ,isCtrlKey) => {
            // Проверка нажатия Ctrl + C
            if (isCtrlKey && e.keyCode === 67) { 
                const cells = graph.getSelectionCells(); // Получаем выделенные ячейки
                copiedCells.length = 0; // Очищаем массив перед копированием
                for (let i = 0; i < cells.length; i++) {
                    copiedCells.push(cells[i]); // Копируем ячейки в массив
                }
                e.preventDefault(); // Отменяем стандартное поведение
            }
    
            // Проверка нажатия Ctrl + V
            if (isCtrlKey && e.keyCode === 86) { 
                if (copiedCells.length > 0) {
                    const parent = graph.getDefaultParent(); // Получаем родительский узел (обычно это слой графа)
                    for (let i = 0; i < copiedCells.length; i++) {
                        // Дублируем каждую скопированную ячейку
                        const clone = graph.cloneCell(copiedCells[i]);
                        const cellGeometry = copiedCells[i].getGeometry(); // Получаем геометрию оригинальной ячейки
                        // Изменяем позицию на 20 пикселей вправо и вниз для вставленной ячейки
                        if (cellGeometry) {
                            clone.setGeometry(new Geometry(cellGeometry.x + 20, cellGeometry.y + 20, cellGeometry.width, cellGeometry.height));
                        }
                        graph.setSelectionCells(graph.importCells([clone], 0, 0, parent));
                        // graph.addCell(clone, parent); // Добавляем ячейку в граф
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

        graph.addListener(InternalEvent.CELLS_RESIZED, (sender, evt) => {
            const evtCell = evt.properties.cells[0];
            const figureHeight = evtCell.geometry.height;
            let rightPortCount = 0, leftPortCount = 0
            evtCell.children.forEach((port) => {
                if(port.connectable) {
                    if(port.geometry._x === 1) {
                        rightPortCount += 1
                    } else {
                        leftPortCount += 1
                    }
                }
            })

            const portsPositions = calculatePortPositions(figureHeight, Math.max(leftPortCount, rightPortCount));

            // Устанавливаем новые Y-координаты для левых портов
            let leftOffset = 0;
            evtCell.children.forEach((port) => {
                if (port.connectable && port.geometry.x !== 1) {
                    port.geometry.offset = new Point(-10, portsPositions[leftOffset])
                    leftOffset++;
                }
            });

            // Устанавливаем новые Y-координаты для правых портов
            let rightOffset = 0;
            evtCell.children.forEach((port) => {
                if (port.connectable && port.geometry.x === 1) {
                    port.geometry.offset = new Point(0, portsPositions[rightOffset]);
                    rightOffset++;
                }
            });

            function calculatePortPositions(figureHeight, portCount) {
                if (portCount === 0) return []; // Если портов нет, возвращаем пустой массив

                const positions = [];

                // Доступная высота для распределения портов
                const totalDistance = (portCount - 1) * 10; // Задаем расстояние между портами
                const availableHeight = figureHeight - totalDistance; // Высота, доступная для размещения портов

                // Если доступная высота меньше или равна нулю, отдаем равные координаты для всех портов
                if (portCount === 1) {
                    const equalY = figureHeight / 2 - (totalDistance / 2);
                    positions.push(equalY - 1);
                } else {
                    let currentY = Math.round((figureHeight - (availableHeight - (figureHeight / portCount))) / 2);

                    // Распределяем порты по высоте
                    for (let i = 0; i < portCount; i++) {
                        positions.push(currentY - Math.round(portCount * 5.35));
                        currentY += Math.round(figureHeight / portCount); // Переходим к следующему порту
                    }
                }

                return positions;
            }
        })

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
        gap: 5,
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