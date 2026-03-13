/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
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
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building, DoorOpen, BedDouble, Bed, User } from 'lucide-react';

interface HierarchyData {
    properties: Array<any>;
}

const PropertyNode = ({ data }: any) => {
    return (
        <div className="w-[364px] bg-background dark:bg-slate-900 border-2 border-primary/50 dark:border-primary/40 rounded-xl shadow-md p-4 transition-colors">
            <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground text-base leading-tight">{data.name}</h3>
                    <p className="text-xs text-muted-foreground">{data.propertyType}</p>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-primary" />
        </div>
    );
};

const UnitNode = ({ data }: any) => {
    return (
        <div className="w-[338px] bg-background dark:bg-slate-900 border border-border rounded-lg shadow-sm p-3 transition-colors">
            <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
            <div className="flex items-center gap-2 mb-2">
                <DoorOpen className="w-4 h-4 text-orange-500" />
                <h4 className="font-medium text-foreground text-sm">Unit {data.unitNumber}</h4>
                <div className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {data.occupants}/{data.maxOccupancy}
                </div>
            </div>
            {data.occupantDetails && data.occupantDetails.length > 0 && (
                <div className="space-y-1.5 mt-2 bg-muted/50 dark:bg-slate-800/50 p-2 rounded-md">
                    {data.occupantDetails.map((occ: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{occ}</span>
                        </div>
                    ))}
                </div>
            )}
            <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />
        </div>
    );
};

const RoomNode = ({ data }: any) => {
    return (
        <div className="w-[286px] bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 transition-colors">
            <Handle type="target" position={Position.Left} className="!bg-slate-400 dark:!bg-slate-600" />
            <div className="flex items-center gap-2 mb-1.5">
                <BedDouble className="w-4 h-4 text-emerald-500" />
                <h4 className="font-medium text-foreground text-sm">Room {data.roomLetter}</h4>
            </div>
            {data.occupantDetails && data.occupantDetails.length > 0 && (
                <div className="space-y-1 mt-2">
                    {data.occupantDetails.map((occ: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <User className="w-3 h-3" />
                            <span>{occ}</span>
                        </div>
                    ))}
                </div>
            )}
            <Handle type="source" position={Position.Right} className="!bg-slate-400 dark:!bg-slate-600" />
        </div>
    );
};

const BedNode = ({ data }: any) => {
    return (
        <div className="w-[234px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
            <Handle type="target" position={Position.Left} className="!bg-slate-300 dark:!bg-slate-700" />
            <div className="flex items-center gap-2">
                <Bed className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium text-foreground text-xs">Bed {data.bedLetter}</span>
            </div>
            {data.occupantDetails && data.occupantDetails.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50 space-y-1">
                    {data.occupantDetails.map((occ: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate">{occ}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const nodeTypes = {
    property: PropertyNode,
    unit: UnitNode,
    room: RoomNode,
    bed: BedNode,
};

export function BirdsViewGraph({ data }: { data: HierarchyData }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useMemo(() => {
        if (!data || !data.properties) return;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        let startY = 50;
        const X_SPACING = 455;

        data.properties.forEach((property: any, pIndex: number) => {
            const pNodeId = `prop-${property.propertyId}`;
            newNodes.push({
                id: pNodeId,
                type: 'property',
                position: { x: 50, y: startY },
                data: { name: property.name, propertyType: property.propertyType },
            });

            let unitStartY = startY;

            property.units?.forEach((unit: any, uIndex: number) => {
                const uNodeId = `unit-${unit.unitId}`;

                let unitOccupants = 0;
                let unitOccupantDetails: string[] = [];
                unit.leases?.forEach((lease: any) => {
                    lease.occupants?.forEach((occ: any) => {
                        unitOccupants++;
                        unitOccupantDetails.push(`${occ.user.fName} ${occ.user.lName}`);
                    });
                });

                newNodes.push({
                    id: uNodeId,
                    type: 'unit',
                    position: { x: 50 + X_SPACING, y: unitStartY },
                    data: {
                        unitNumber: unit.unitNumber,
                        occupants: unitOccupants,
                        maxOccupancy: unit.maxOccupancy || '?',
                        occupantDetails: unitOccupantDetails,
                    },
                });

                newEdges.push({
                    id: `e-${pNodeId}-${uNodeId}`,
                    source: pNodeId,
                    target: uNodeId,
                    type: 'smoothstep',
                    style: { stroke: '#94a3b8' },
                });

                let roomStartY = unitStartY;

                unit.rooms?.forEach((room: any, rIndex: number) => {
                    const rNodeId = `room-${room.roomId}`;

                    let roomOccupants = 0;
                    let roomOccupantDetails: string[] = [];
                    room.leases?.forEach((lease: any) => {
                        lease.occupants?.forEach((occ: any) => {
                            roomOccupants++;
                            roomOccupantDetails.push(`${occ.user.fName} ${occ.user.lName}`);
                        });
                    });

                    newNodes.push({
                        id: rNodeId,
                        type: 'room',
                        position: { x: 50 + X_SPACING * 2, y: roomStartY },
                        data: {
                            roomLetter: room.roomLetter,
                            occupants: roomOccupants,
                            occupantDetails: roomOccupantDetails,
                        },
                    });

                    newEdges.push({
                        id: `e-${uNodeId}-${rNodeId}`,
                        source: uNodeId,
                        target: rNodeId,
                        type: 'smoothstep',
                        style: { stroke: '#cbd5e1' },
                    });

                    let bedStartY = roomStartY;

                    room.beds?.forEach((bed: any, bIndex: number) => {
                        const bNodeId = `bed-${bed.bedId}`;

                        let bedOccupantDetails: string[] = [];
                        bed.leases?.forEach((lease: any) => {
                            lease.occupants?.forEach((occ: any) => {
                                bedOccupantDetails.push(`${occ.user.fName} ${occ.user.lName}`);
                            });
                        });

                        newNodes.push({
                            id: bNodeId,
                            type: 'bed',
                            position: { x: 50 + X_SPACING * 3, y: bedStartY },
                            data: {
                                bedLetter: bed.bedLetter,
                                occupantDetails: bedOccupantDetails,
                            },
                        });

                        newEdges.push({
                            id: `e-${rNodeId}-${bNodeId}`,
                            source: rNodeId,
                            target: bNodeId,
                            type: 'smoothstep',
                            style: { stroke: '#e2e8f0' },
                        });

                        bedStartY += Math.max(80, 50 + bedOccupantDetails.length * 20);
                    });

                    roomStartY = Math.max(roomStartY + Math.max(120, 80 + roomOccupantDetails.length * 24), bedStartY);
                });

                unitStartY = Math.max(unitStartY + Math.max(150, 100 + unitOccupantDetails.length * 24), roomStartY);
            });

            startY = Math.max(startY + 200, unitStartY);
        });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [data, setNodes, setEdges]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 200px)' }} className="border border-border rounded-xl shadow-inner bg-slate-50/50 dark:bg-slate-950/20 relative overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Controls className="fill-foreground text-foreground [&>button]:bg-background [&>button]:border-border [&>button]:hover:bg-muted" />
                <MiniMap 
                    className="bg-background border border-border rounded-lg overflow-hidden [&>svg]:bg-slate-50 [&>svg]:dark:bg-slate-950" 
                    maskColor="rgba(0, 0, 0, 0.1)"
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'property': return '#3b82f6';
                            case 'unit': return '#f97316';
                            case 'room': return '#10b981';
                            case 'bed': return '#64748b';
                            default: return '#cbd5e1';
                        }
                    }}
                />
                <Background gap={12} size={1} color="currentColor" className="text-slate-200 dark:text-slate-800" />
            </ReactFlow>
        </div>
    );
}
