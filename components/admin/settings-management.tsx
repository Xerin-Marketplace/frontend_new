"use client"

import * as React from "react"
import {
  Settings,
  Globe,
  MessageSquare,
  Mail,
  Smartphone,
  Truck,
  ShieldCheck,
  Save,
  Sparkles,
  Search,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableSkeleton } from "@/components/skeletons"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type SystemSettingT = {
  id: string
  key: string
  value: string | null
  data_type: string
  category: string
  description: string | null
  is_public: boolean
  is_encrypted: boolean
  updated_at: string | null
  created_at: string
}

type Category = "platform" | "sms" | "email" | "mobile" | "delivery" | "security"

const categoryIcon: Record<string, React.ReactNode> = {
  platform: <Globe className="size-5" />,
  sms: <MessageSquare className="size-5" />,
  email: <Mail className="size-5" />,
  mobile: <Smartphone className="size-5" />,
  delivery: <Truck className="size-5" />,
  security: <ShieldCheck className="size-5" />,
}

const categoryLabel: Record<string, string> = {
  platform: "Platform",
  sms: "SMS",
  email: "Email",
  mobile: "Mobile App",
  delivery: "Delivery",
  security: "Security",
}

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

export function SettingsManagement() {
  const [settings, setSettings] = React.useState<SystemSettingT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeCategory, setActiveCategory] = React.useState<Category>("platform")
  const [search, setSearch] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [editedValues, setEditedValues] = React.useState<Record<string, string>>({})

  const load = React.useCallback(() => {
    setLoading(true)
    api.get<{ total: number; results: SystemSettingT[] }>("/settings?page_size=200")
      .then((d) => setSettings(d.results))
      .catch((err) => toast.add({ title: "Failed to load settings", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const categories = React.useMemo(() => {
    const cats = new Set(settings.map((s) => s.category))
    return Array.from(cats).sort()
  }, [settings])

  const filtered = settings.filter((s) => {
    if (s.category !== activeCategory) return false
    if (search && !s.key.toLowerCase().includes(search.toLowerCase()) && !(s.description ?? "").toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSave = async () => {
    const changes = Object.entries(editedValues).filter(([key]) =>
      settings.some((s) => s.key === key)
    )
    if (changes.length === 0) {
      toast.add({ title: "No changes to save", type: "info" })
      return
    }
    setSaving(true)
    try {
      await api.put("/settings/bulk", { settings: Object.fromEntries(changes) })
      toast.add({ title: "Settings saved", description: `${changes.length} setting(s) updated`, type: "success" })
      setEditedValues({})
      load()
    } catch (err) {
      toast.add({ title: "Failed to save settings", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleSeed = async () => {
    try {
      const result = await api.post<{ created: number; skipped: number }>("/settings/seed", {})
      toast.add({ title: "Settings seeded", description: `${result.created} created, ${result.skipped} skipped`, type: "success" })
      load()
    } catch (err) {
      toast.add({ title: "Failed to seed settings", description: message(err), type: "error" })
    }
  }

  const getValue = (key: string, original: string | null) => editedValues[key] ?? original ?? ""
  const setValue = (key: string, value: string) => setEditedValues((prev) => ({ ...prev, [key]: value }))

  const renderInput = (setting: SystemSettingT) => {
    const val = getValue(setting.key, setting.value)
    if (setting.data_type === "boolean") {
      return (
        <Select value={val || "false"} onValueChange={(v) => setValue(setting.key, v ?? "false")}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Enabled</SelectItem>
            <SelectItem value="false">Disabled</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    if (setting.data_type === "integer") {
      return <Input type="number" value={val} onChange={(e) => setValue(setting.key, e.target.value)} className="max-w-[200px]" />
    }
    if (setting.value && setting.value.length > 80) {
      return <Textarea value={val} onChange={(e) => setValue(setting.key, e.target.value)} rows={2} />
    }
    return <Input value={val} onChange={(e) => setValue(setting.key, e.target.value)} className="max-w-[400px]" />
  }

  const hasChanges = Object.keys(editedValues).length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure platform, SMS, email, mobile app, delivery, and security settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}><Sparkles className="size-4" /> Seed Defaults</Button>
          {hasChanges && (
            <Button onClick={handleSave} loading={saving}><Save className="size-4" /> Save Changes ({Object.keys(editedValues).length})</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Category sidebar */}
        <div className="flex flex-row gap-2 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as Category)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
                activeCategory === cat
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              {categoryIcon[cat] ?? <Settings className="size-5" />}
              <span>{categoryLabel[cat] ?? cat}</span>
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search settings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Settings className="size-12 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No settings found</p>
                  <p className="text-xs text-muted-foreground">Click "Seed Defaults" to create standard settings.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {categoryIcon[activeCategory]}
                  {categoryLabel[activeCategory] ?? activeCategory} Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {filtered.map((setting, idx) => (
                  <React.Fragment key={setting.id}>
                    {idx > 0 && <Separator className="my-3" />}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium font-mono">{setting.key}</Label>
                          {setting.is_public && <Badge variant="outline" className="text-xs">Public</Badge>}
                          {setting.is_encrypted && <Badge variant="secondary" className="text-xs">Encrypted</Badge>}
                        </div>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                        )}
                      </div>
                      <div className="sm:ml-4">{renderInput(setting)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
