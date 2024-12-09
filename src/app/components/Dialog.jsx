import {useRef, useEffect, useState, Children} from 'react';
import generateFigure from '../utils/generateFigure';
import generatePorts from '../utils/generatePorts';
import {ImageBox} from '@maxgraph/core';

const initFormState = {id: '', title: '', leftPortsNum: 0, rightPortsNum: 0, leftPorts: [], rightPorts: []}

export default function Dialog({graph, toolbar, addToToolbar}) {
    const rootRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [formState, setFormState] = useState(initFormState)
    const handleOpenDialog = () => {
        setFormState(initFormState)
        setIsOpen(true)
    }
    const handleCloseDialog = () => setIsOpen(false)

    useEffect(() => {
        const handleWindowClick = (e) => {
            if(e.target && e.target === rootRef.current) setIsOpen(false)
        }
        document.addEventListener('click', handleWindowClick)
        return () => document.removeEventListener('click', handleWindowClick )
    }, [])

    const handleFormChange = (e) => {
        if(e.target.className.match(/leftPortsNum|rightPortsNum/)) {
            if(Number.isNaN(+e.target.value) || e.target.value.length > 2) return 
            const newState = {...formState, [e.target.className]: e.target.value}
            setFormState(newState)
            handlePortsNumChange(+e.target.value, e.target.className, newState)
        } else {
            setFormState({...formState, [e.target.className]: e.target.value})
        }
        
    }

    const createSvgCell = (text, color, stroke, width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="${width}" height="${height}" fill="${color}" stroke="${stroke}" />
                <text x="50%" y="50%" font-family="Arial,Helvetica" dominant-baseline="middle" text-anchor="middle" fill="#774400">${text}</text>
               </svg>`;

    const updatePorts = (num, portType, newState) => {
        const prevPorts = newState[portType];
        prevPorts.length = num;
        const newPorts = Array.from({ length: num }, (v, i) => prevPorts[i] || '');
        return {...newState, [portType]: newPorts};
    }

    const handlePortsNumChange = (num, port, newState) => {
        if(num) {
            setFormState(updatePorts(num, port.match(/leftPortsNum/) ? 'leftPorts' : 'rightPorts', newState));
        } else {
            setFormState({...newState, [port.match(/leftPortsNum/) ? 'leftPorts' : 'rightPorts']: []}) 
        }
    }

    const hanldeCreateElement = (e) => {
        e.preventDefault()
        const defWight = 100;
        const defHeight = 20;
        const heigth = defHeight * (Math.max(formState.rightPortsNum, formState.leftPortsNum));
        const cell = generateFigure(graph, defWight, heigth || defHeight, formState.title, formState.id, {editable: true})
        const portNames = {};
        formState.leftPorts.forEach((port, idx) => portNames[`leftport${idx + 1}`] = port)
        formState.rightPorts.forEach((port, idx) => portNames[`rightport${idx + 1}`] = port)
        const svgCode = createSvgCell(formState.title, '#c3d9ff', '#6482b9', defWight, heigth || defHeight)
        const svgImage = new Image(defWight, heigth)
        svgImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgCode);
        svgImage.className = 'mxToolbarMode'
        generatePorts(graph, cell, formState.leftPortsNum, formState.rightPortsNum, portNames)
        addToToolbar(graph, toolbar, cell, svgImage, undefined);
        setIsOpen(false)
    }

    const handlePortNameChange = (num) => (e) => {
        if(e.target.className == 'leftPort') {
            const newPorts = formState.leftPorts.map((port, idx) => idx === num ? e.target.value : port)
            setFormState({...formState, leftPorts: newPorts})
        } else {
            const newPorts = formState.rightPorts.map((port, idx) => idx === num ? e.target.value : port)
            setFormState({...formState, rightPorts: newPorts})
        }
    }

    return (
        <>
            {isOpen && (
                <div ref={rootRef} style={styles.root}>
                    <form style={styles.content}>
                        <span onClick={handleCloseDialog} style={styles.closeBtn}>&times;</span>
                        <div style={styles.section}>
                            <label style={styles.label}>
                                Идентификатор:
                                <input style={styles.input} className='id' placeholder='Идентификатор' type='text' value={formState.id} onChange={handleFormChange}/>
                            </label>
                            <label style={styles.label}>
                                Название:
                                <input style={styles.input} className='title' placeholder='Название' type='text' value={formState.title} onChange={handleFormChange}/>
                            </label>
                        </div>
                        <div style={styles.section}>
                            <div style={styles.ports}>
                                <label style={styles.label}>
                                    Кол-во левых портов:
                                    <input style={styles.inputNum}  className='leftPortsNum' type='text' value={formState.leftPortsNum} onChange={handleFormChange}/>
                                </label>
                                {!!formState.leftPorts.length && Children.toArray(formState.leftPorts.map((port , idx) => (
                                    <label>
                                        Порт №{idx + 1}
                                        <input style={styles.input} className='leftPort' type='text' value={port} onChange={handlePortNameChange(idx)}/>
                                    </label>
                                )))}
                            </div>
                            <div style={styles.ports}>
                                <label style={styles.label}>
                                    Кол-во правых портов:
                                    <input style={styles.inputNum} className='rightPortsNum' type='text' value={formState.rightPortsNum} onChange={handleFormChange}/>
                                </label>
                                {!!formState.rightPorts.length && Children.toArray(formState.rightPorts.map((port , idx) => (
                                    <label>
                                        Порт №{idx + 1}
                                        <input style={styles.input} className='rightPort' type='text' value={port} onChange={handlePortNameChange(idx)}/>
                                    </label>
                                )))}
                            </div>
                        </div>
                        <button onClick={hanldeCreateElement}>Create Element</button>
                    </form>
                </div>
            )}
            <button onClick={handleOpenDialog} style={styles.openBtn}>Create Element</button>
        </>   
    )
}

const styles = {
    root: {
        position: 'fixed',
        zIndex: 1000,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        backgroundColor: '#FFF',
        borderRadius: '5px',
        margin: '15% auto',
        padding: '35px 20px 20px',
        width: 'calc(100vw - 350px)',
        height: 'calc(100vh - 350px)',
        position: 'relative',
        textAlign: 'center',
        
    },
    closeBtn: {
        position: 'absolute',
        top: '10px',
        right: '15px',
        cursor: 'pointer',
        fontSize: '20px'
    },
    openBtn: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 999,
    },
    section: {
        margin: '0 20px',
        display: 'flex',
        gap: 30,
    },
    label: {
        display: 'flex',
        width: '100%'
    },
    ports: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 438px)',
        overflow: 'scroll'
    },
    inputNum: {
        width: '20px',
        marginLeft: '10px',
    },
    input: {
        marginLeft: '10px',
        width: '94%'
    }
}

