import { Point, Graph, Cell } from "@maxgraph/core";

const commonPortStyles = {
    shape: 'line',
    verticalAlign: 'middle',
    fontSize: 10,
    fontColor: 'black',
    strokeColor: 'black',
    strokeWidth: 1,
    border: '1px solid black'
}

/**
 * Генерирует порты (выходы) для указанной ячейки в графе.
 *
 * @param {Graph} graph - Экземпляр графа, в котором создаются порты.
 * @param {Cell} cell - Ячейка, для которой будут добавлены порты.
 * @param {number} leftPorts - Количество портов, которые необходимо добавить слева.
 * @param {number} rightPorts - Количество портов, которые необходимо добавить справа.
 * @param {Object} names - Объект, содержащий названия для портов.
 * @param {string} names.leftport1 - Пример ключа для названия левого порта (начинается всегда с 1).
 * @param {string} names.rightport1 - Пример ключа для названия правого порта (начинается всегда с 1).
 * 
 * @returns {Cell} Возвращает модифицированную ячейку с добавленными портами.
 */
export default function generatePorts(graph, cell, leftPorts, rightPorts, names) {
    let leftPortShape, rightPortShape;
    for(let i = 0; i < leftPorts; i++) {
        if(!leftPortShape) {
            leftPortShape = graph.insertVertex(cell, null, names ? names[`leftport${i + 1}`] : '', 0, 0, 10, 2, {...commonPortStyles, align: 'left',routingCenterX: -0.5, spacingLeft: 12})
            leftPortShape.geometry.relative = true;
            leftPortShape.geometry.offset = new Point(-leftPortShape.geometry.width, 9);
        } else {
            const leftPort = leftPortShape.clone();
            leftPort.value = names ? names[`leftport${i + 1}`] : '';
            leftPort.geometry.offset = new Point(-leftPort.geometry.width, i * 20 + 9);
            cell.insert(leftPort)
        }
    }
    for(let i = 0; i < rightPorts; i++) {
        if(!rightPortShape) {
            rightPortShape = graph.insertVertex(cell, null, names ? names[`rightport${i + 1}`] : '' , 1, 0, 10, 2, {...commonPortStyles, align: 'right',routingCenterX: 0.5, spacingRight: 12})
            rightPortShape.geometry.relative = true;
            rightPortShape.geometry.offset = new Point(0, 9);
        } else {
            const rightPort = rightPortShape.clone();
            rightPort.value = names ? names[`rightport${i + 1}`] : '';
            rightPort.geometry.offset = new Point(0, i * 20 + 9);
            cell.insert(rightPort)
        }
    }


    
}