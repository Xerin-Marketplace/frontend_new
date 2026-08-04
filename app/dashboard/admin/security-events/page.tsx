"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Lock, RefreshCw, Search } from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/skeletons"

type SecurityEvent = { id:string; event_type:string; severity:string; actor_user_id:string|null; user_id?:string|null; ip_address:string|null; user_agent:string|null; description:string|null; event_metadata:Record<string,unknown>|null; resolved:boolean; resolved_at:string|null; created_at:string }
const errorText=(error:unknown)=>(error as ApiError)?.detail || "We could not retrieve security events. Please try again."
const pageSize=20

export default function SecurityEventsPage(){
  const { isSuperAdmin,hasPermission }=useAuth()
  const canManage=isSuperAdmin || hasPermission("security_events:manage")
  const [events,setEvents]=React.useState<SecurityEvent[]>([])
  const [page,setPage]=React.useState(1)
  const [total,setTotal]=React.useState(0)
  const [loading,setLoading]=React.useState(true)
  const [error,setError]=React.useState<string|null>(null)
  const [search,setSearch]=React.useState("")
  const [resolving,setResolving]=React.useState<string|null>(null)

  const load=React.useCallback(async()=>{ if(!isSuperAdmin)return; setLoading(true);setError(null);try{const offset=(page-1)*pageSize;const response=await api.get<SecurityEvent[]>(`/audit-logs/security/events?offset=${offset}&limit=${pageSize+1}`);const records=(Array.isArray(response)?response:[]).map((event)=>({...event,user_id:event.actor_user_id}));const hasNext=records.length>pageSize;setEvents(records.slice(0,pageSize));setTotal(hasNext?page*pageSize+1:offset+records.length)}catch(requestError){setError(errorText(requestError))}finally{setLoading(false)}},[isSuperAdmin,page])
  React.useEffect(()=>{void load()},[load])
  const resolve=async(id:string)=>{setResolving(id);try{const updated=await api.patch<SecurityEvent>(`/audit-logs/security/events/${id}/resolve`,{note:null});setEvents((current)=>current.map((item)=>item.id===id?updated:item))}catch(requestError){setError(errorText(requestError))}finally{setResolving(null)}}
  const query=search.trim().toLowerCase();const filtered=events.filter((event)=>!query||event.event_type.toLowerCase().includes(query)||(event.description??"").toLowerCase().includes(query)||(event.ip_address??"").toLowerCase().includes(query)||(event.actor_user_id??"").toLowerCase().includes(query));const totalPages=Math.max(1,Math.ceil(total/pageSize))

  if(!isSuperAdmin)return <div className="flex flex-col items-center justify-center gap-3 py-20"><AlertCircle className="size-10 text-amber-500"/><h2 className="text-lg font-semibold">Super Admin Only</h2><p className="text-sm text-muted-foreground">You need super admin privileges to access this page.</p></div>
  return <div className="flex flex-col gap-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Security Events</h2><p className="text-sm text-muted-foreground">Monitor successful logins, failed attempts, logouts and session activity.</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`size-4 ${loading?"animate-spin":""}`}/> Refresh</Button></div>
  {error&&<div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"><div><div className="font-semibold">Unable to load security events</div><div className="text-sm opacity-80">{error}</div></div><Button variant="outline" size="sm" onClick={()=>void load()}>Try again</Button></div>}
  <Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Lock className="size-4"/> All Security Events</CardTitle><CardDescription>{total} recorded events</CardDescription></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search event, user or IP..." className="pl-9"/></div></CardHeader><CardContent>{loading?<TableSkeleton rows={8} cols={7}/>:<Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Severity</TableHead><TableHead>User</TableHead><TableHead>IP address</TableHead><TableHead>Session duration</TableHead><TableHead>Recorded</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader><TableBody>{filtered.length===0?<TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No security events found.</TableCell></TableRow>:filtered.map((event)=><TableRow key={event.id}><TableCell><div className="font-medium">{event.event_type.replaceAll("_"," ")}</div><div className="max-w-xs truncate text-xs text-muted-foreground">{event.description??"—"}</div></TableCell><TableCell><Badge variant={event.severity==="high"||event.severity==="critical"?"destructive":event.severity==="medium"?"secondary":"outline"}>{event.severity}</Badge></TableCell><TableCell className="font-mono text-xs">{event.user_id?.slice(0,8)??"Unknown"}</TableCell><TableCell className="text-xs">{event.ip_address??"—"}</TableCell><TableCell>{formatDuration(event.event_metadata?.duration_seconds)}</TableCell><TableCell className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</TableCell><TableCell className="text-right">{event.resolved?<Badge variant="outline"><CheckCircle2 className="size-3"/> Resolved</Badge>:canManage?<Button size="sm" variant="outline" disabled={resolving===event.id} onClick={()=>void resolve(event.id)}>{resolving===event.id?"Resolving...":"Resolve"}</Button>:<Badge variant="secondary">Open</Badge>}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
  {totalPages>1&&<div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page===1} onClick={()=>setPage((value)=>value-1)}><ChevronLeft className="size-4"/> Previous</Button><Button variant="outline" size="sm" disabled={page===totalPages} onClick={()=>setPage((value)=>value+1)}>Next <ChevronRight className="size-4"/></Button></div></div>}</div>
}

function formatDuration(value:unknown){if(typeof value!=="number")return "—";const hours=Math.floor(value/3600);const minutes=Math.floor((value%3600)/60);const seconds=Math.floor(value%60);return hours?`${hours}h ${minutes}m`:minutes?`${minutes}m ${seconds}s`:`${seconds}s`}
