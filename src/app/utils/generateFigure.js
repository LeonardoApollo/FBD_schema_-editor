import { Cell, Geometry, Point, Graph } from "@maxgraph/core";
/**
 * Генерирует фигуру в графе с указанными размерами, лейблом и стилем.
 *
 * @param {Graph} graph - Экземпляр графа, в который будет добавлена фигура.
 * @param {number} w - Ширина фигуры.
 * @param {number} h - Высота фигуры.
 * @param {string} label - Основной лейбл фигуры.
 * @param {string} [sublabel] - Дополнительый лейбл (сублейбл) фигуры (необязательный параметр).
 * @param {object} style - Стиль, применяемый к фигуре.
 * 
 * @returns {Cell} - Созданная фигура
 *
 * @example
 * const myGraph = new Graph(container);
 * const myFigure = generateFigure(myGraph, 100, 50, 'Main Label', 'Sub Label', { fillColor: 'red' });
 */
export default function generateFigure(graph,w,h, label, sublabel, style) {
    const cell = new Cell(label, new Geometry(0, 0, w, h), style);
    if(sublabel) {
        const subLabel = graph.insertVertex(cell, null, sublabel, 0.5, 0, 0, 0, {
            editable: true,
        })
        subLabel.geometry.relative = true;
        subLabel.geometry.offset = new Point(0, -10);
        subLabel.setConnectable(false)
    }
    cell.setVertex(true)
    cell.setConnectable(false)
    return cell
}