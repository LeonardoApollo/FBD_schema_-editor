import { Cell, Graph, Point } from "@maxgraph/core";

/**
 * Создает ребро с небольшим смещением по оси X.
 * 
 * @param {Graph} graph - Экземпляр графа, в который будет добавлено ребро.
 * @param {Cell} parent - Родительская ячейка, к которой будет добавлено ребро.
 * @param {Cell} source - Исходная ячейка (узел), откуда начинается ребро.
 * @param {Cell} target - Целевая ячейка (узел), куда ведет ребро.
 * @param {number} edgeOffset - Смещение по оси X для ребра.
 * @returns {Cell} - Созданное ребро.
 */
export default function createEdgeWithOffset(graph, parent, source, target, edgeOffset) {
    const edgeCell = graph.insertEdge(parent, null, '', source, target);
    const edgeGeometry = edgeCell.getGeometry();

    if (edgeGeometry) {
        edgeGeometry.points = [
            new Point(
                source.parent.geometry.x + source.parent.geometry.width + edgeOffset + 10 + 2, // Смещение по X
                source.parent.geometry.y + source.geometry.offset._y + 1 // Положение по Y
            )
        ];
        edgeCell.setGeometry(edgeGeometry);
    }

    return edgeCell;
}