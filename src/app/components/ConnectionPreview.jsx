export default function ConnectionPreview({cells}) {
    const edges = cells.filter(cell => cell.isEdge())
    let connections = [];
    if(edges) {
        connections = edges.map(edge => {
            const source = edge.source;
            const target = edge.target;
            let sourceName, targetName;
            if(source.parent.children[0]?.style.shape !== 'line' && source.parent.children[0]?.value) {
                sourceName = source.parent.children[0]?.value
            } else {
                sourceName = source.parent.value
            }
            if(target.parent.children[0]?.style.shape !== 'line' && target.parent.children[0]?.value) {
                targetName = target.parent.children[0]?.value
            } else {
                targetName = target.parent.value
            }
            return {
                source: source.value ? `${source.value}#${sourceName}` : source.parent.value, 
                target: target.value ? `${target.value}#${targetName}` : target.parent.value
            }
        })
    }
    console.log(connections)
    return null
}