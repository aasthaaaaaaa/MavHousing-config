import React, { useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface HierarchyData {
    properties: Array<any>;
}

// Custom Node Types could be defined here later, using default for now

export function BirdsViewGraph({ data }: { data: HierarchyData }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useMemo(() => {
        if (!data || !data.properties) return;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        let startY = 50;
        const X_SPACING = 350;
        const Y_SPACING = 150;

        data.properties.forEach((property: any, pIndex: number) => {
            const pNodeId = `prop-${property.propertyId}`;
            newNodes.push({
                id: pNodeId,
                position: { x: 50, y: startY },
                data: { label: `🏢 ${property.name} (${property.propertyType})` },
                style: {
                    background: '#f8fafc',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    width: 250,
                },
            });

            let unitStartY = startY;

            property.units?.forEach((unit: any, uIndex: number) => {
                const uNodeId = `unit-${unit.unitId}`;

                // Count occupants in unit-level leases
                let unitOccupants = 0;
                let occupantDetails = '';
                unit.leases?.forEach((lease: any) => {
                    lease.occupants?.forEach((occ: any) => {
                        unitOccupants++;
                        occupantDetails += `\n👤 ${occ.user.fName} ${occ.user.lName}`;
                    });
                });

                newNodes.push({
                    id: uNodeId,
                    position: { x: 50 + X_SPACING, y: unitStartY },
                    data: { label: `🚪 Unit ${unit.unitNumber}\nOccupants: ${unitOccupants}/${unit.maxOccupancy || '?'}${occupantDetails}` },
                    style: {
                        background: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '4px',
                        padding: '8px',
                        width: 250,
                    },
                });

                newEdges.push({
                    id: `e-${pNodeId}-${uNodeId}`,
                    source: pNodeId,
                    target: uNodeId,
                    type: 'smoothstep',
                });

                let roomStartY = unitStartY;

                unit.rooms?.forEach((room: any, rIndex: number) => {
                    const rNodeId = `room-${room.roomId}`;

                    let roomOccupants = 0;
                    let roomOccupantDetails = '';
                    room.leases?.forEach((lease: any) => {
                        lease.occupants?.forEach((occ: any) => {
                            roomOccupants++;
                            roomOccupantDetails += `\n👤 ${occ.user.fName} ${occ.user.lName}`;
                        });
                    });

                    newNodes.push({
                        id: rNodeId,
                        position: { x: 50 + X_SPACING * 2, y: roomStartY },
                        data: { label: `🛏️ Room ${room.roomLetter}\nOccupants: ${roomOccupants}${roomOccupantDetails}` },
                        style: {
                            background: '#f1f5f9',
                            border: '1px dashed #64748b',
                            padding: '6px',
                            width: 200,
                        },
                    });

                    newEdges.push({
                        id: `e-${uNodeId}-${rNodeId}`,
                        source: uNodeId,
                        target: rNodeId,
                        type: 'smoothstep',
                    });

                    let bedStartY = roomStartY;

                    room.beds?.forEach((bed: any, bIndex: number) => {
                        const bNodeId = `bed-${bed.bedId}`;

                        let bedOccupantDetails = '';
                        bed.leases?.forEach((lease: any) => {
                            lease.occupants?.forEach((occ: any) => {
                                bedOccupantDetails += `\n👤 ${occ.user.fName} ${occ.user.lName}`;
                            });
                        });

                        newNodes.push({
                            id: bNodeId,
                            position: { x: 50 + X_SPACING * 3, y: bedStartY },
                            data: { label: `🛏️ Bed ${bed.bedLetter}${bedOccupantDetails}` },
                            style: {
                                background: '#e2e8f0',
                                border: '1px solid #cbd5e1',
                                padding: '4px',
                                fontSize: '12px',
                                width: 150,
                            },
                        });

                        newEdges.push({
                            id: `e-${rNodeId}-${bNodeId}`,
                            source: rNodeId,
                            target: bNodeId,
                            type: 'smoothstep',
                        });

                        bedStartY += 100;
                    });

                    roomStartY = Math.max(roomStartY + 120, bedStartY);
                });

                unitStartY = Math.max(unitStartY + 150, roomStartY);
            });

            startY = Math.max(startY + 200, unitStartY);
        });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [data, setNodes, setEdges]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 200px)' }} className="border rounded-xl shadow-inner bg-slate-50 relative overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
