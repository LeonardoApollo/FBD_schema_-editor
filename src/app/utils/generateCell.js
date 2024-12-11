import generateFigure from "./generateFigure";
import generatePorts from "./generatePorts";

const style = {editable: true}
export default function generateCell(graph,type) {
    let cell;
    const beforeDot = type.split('.')
    if(type.match('Valve')) {
        cell = generateFigure(graph, 100, 100, beforeDot[0], '', style)
        generatePorts(graph, cell, 1, 5, {leftport1: 'step', rightport1: 'state', rightport2: 'on', rightport3: 'off', rightport4: 'toggle', rightport5:'error'})
    } else if(type.match('transition')) {
        cell = generateFigure(graph, 120, 60, type, '', style)
        generatePorts(graph, cell, 3, 2, {leftport1: 'IN1', leftport2: 'IN2', leftport3: 'Step',  rightport1: 'true', rightport2: 'false'})
    } else if (type.match('step')) {
        cell = generateFigure(graph, 100, 120, type, '', style)
        generatePorts(graph, cell, 1, 6, {leftport1: 'BEGIN', rightport1: 'CMD1', rightport2: 'CMD2', rightport3: 'CMD3', rightport4: 'CMD4', rightport5: 'CMD5', rightport6: 'FINISH'})
    } else if (type.match('start')) {
        cell = generateFigure(graph, 60, 20, type, null, style)
        generatePorts(graph, cell, 0, 1, null)
    } else if (type.match('exit')) {
        cell = generateFigure(graph, 60, 20, type, null, style)
        generatePorts(graph, cell, 1, 0, null)
    } else {
        cell = generateFigure(graph, 100, 120, beforeDot[0], '', style)
        generatePorts(graph, cell, 1, 6, {leftport1: 'step',rightport1: 'state', rightport2: 'auto',  rightport3: 'on', rightport4: 'off', rightport5: 'toggle', rightport6:'error'})
    }
    return cell
}