import generateFigure from "./generateFigure";
import generatePorts from "./generatePorts";


export default function generateCell(graph,type) {
    let cell;
    const beforeDot = type.split('.')
    if(type.match('Valve')) {
        cell = generateFigure(graph, 120, 100, beforeDot[0], '', {editable: true})
        generatePorts(graph, cell, 0, 5, {rightport1: 'state', rightport2: 'on', rightport3: 'off', rightport4: 'toggle', rightport5:'error'})
    } else if(type.match('Transition')) {
        cell = generateFigure(graph, 120, 60, beforeDot[0], '', {editable: true})
        generatePorts(graph, cell, 3, 2, {leftport1: 'IN1', leftport2: 'IN2', leftport3: 'Step',  rightport1: 'true', rightport2: 'false'})
    } else {
        cell = generateFigure(graph, 120, 120, beforeDot[0], '', {editable: true})
        generatePorts(graph, cell, 0, 6, {rightport1: 'state', rightport2: 'auto',  rightport3: 'on', rightport4: 'off', rightport5: 'toggle', rightport6:'error'})
    }
    return cell
}