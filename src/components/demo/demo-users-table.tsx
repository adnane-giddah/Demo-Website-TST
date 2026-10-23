"use client";
import { useState } from "react";
import { RoleBadge, UserStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEMO_USERS, type DemoUser } from "@/lib/demo/data";
export function DemoUsersTable() {
    const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS);
    const setStatus = (id: string, status: DemoUser["status"]) => setUsers((list) => list.map((u) => (u.id === id ? { ...u, status } : u)));
    return (<div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead>Role</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {users.map((user) => (<TableRow key={user.id}>
 <TableCell>
 <div className="font-medium">{user.name}</div>
 <div className="text-xs text-muted-foreground">{user.email}</div>
 </TableCell>
 <TableCell><RoleBadge role={user.role}/></TableCell>
 <TableCell><UserStatusBadge status={user.status}/></TableCell>
 <TableCell className="text-right">
 {user.role === "SUPER_ADMIN" ? null : user.status === "PENDING" ? (<Button size="sm" onClick={() => setStatus(user.id, "APPROVED")}>Approve</Button>) : user.status === "APPROVED" ? (<Button size="sm" variant="outline" onClick={() => setStatus(user.id, "SUSPENDED")}>Suspend</Button>) : (<Button size="sm" variant="outline" onClick={() => setStatus(user.id, "APPROVED")}>Reinstate</Button>)}
 </TableCell>
 </TableRow>))}
 </TableBody>
 </Table>
 </div>);
}
