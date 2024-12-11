import generateFigure from "./generateFigure";
import generatePorts from "./generatePorts";

const style1 = {editable: true}
const style2 = {editable: false}
export default function generateCell(graph,type, title, subtitle) {
    let cell;
    const beforeDot = type.split('.')
    if(type.indexOf('Valve') !== -1) {
        cell = generateFigure(graph, 110, 100, beforeDot[0], type, style2)
        generatePorts(graph, cell, 1, 5, {leftport1: 'step', rightport1: 'state', rightport2: 'on', rightport3: 'off', rightport4: 'toggle', rightport5:'error'})
    } else if(type.indexOf('transition') !== -1) {
        cell = generateFigure(graph, 160, 60, title, subtitle, style1)
        generatePorts(graph, cell, 3, 2, {leftport1: 'Step', leftport2: 'IN1', leftport3: 'IN2',  rightport1: 'true', rightport2: 'false'})
    } else if (type.indexOf('step') !== -1) {
        cell = generateFigure(graph, 110, 120, type, type, style2)
        generatePorts(graph, cell, 1, 6, {leftport1: 'BEGIN', rightport1: 'CMD1', rightport2: 'CMD2', rightport3: 'CMD3', rightport4: 'CMD4', rightport5: 'CMD5', rightport6: 'FINISH'})
    } else if (type.indexOf('start') !== -1) {
        cell = generateFigure(graph, 60, 20, type, null, style2)
        generatePorts(graph, cell, 0, 1, null)
    } else if (type.indexOf('exit') !== -1 || type.indexOf('exec') !== -1) {
        cell = generateFigure(graph, 60, 20, type, null, style2)
        generatePorts(graph, cell, 1, 0, null)
    } else {
        cell = generateFigure(graph, 110, 120, beforeDot[0], type, style2)
        generatePorts(graph, cell, 1, 6, {leftport1: 'step',rightport1: 'state', rightport2: 'auto',  rightport3: 'on', rightport4: 'off', rightport5: 'toggle', rightport6:'error'})
    }
    return cell
}