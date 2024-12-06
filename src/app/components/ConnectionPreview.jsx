export default function ConnectionPreview({cells}) {
    const edges = cells.filter(cell => cell.isEdge())
    let connections = [];
    if(edges) {
        connections = edges.map(edge => {
            let sourceName, targetName, source, target;
            if(edge.source.geometry.x === 1) {
                source = edge.source
                target = edge.target
            } else {
                source = edge.target
                target = edge.source
            }
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
                id: edge.id,
                source: source.value ? `${source.value}#${sourceName}` : source.parent.value, 
                target: target.value ? `${target.value}#${targetName}` : target.parent.value
            }
        })
    }
    return (
        <div style={styles.root}>
            {connections.map(connection => (
                <div key={connection.id}>
                    {`${connection.source} => ${connection.target}`}
                </div>
            ))}
        </div>
    )
}

const styles = {
    root: {
        width: '250px',
        overflow: 'scroll',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        paddingLeft: '5px',
        marginTop: '10px'
    },
}