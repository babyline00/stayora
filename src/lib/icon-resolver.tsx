'use client'

// Map DB-stored icon names (strings) to Lucide components.
// Used by wizard steps, amenities, categories, destinations.
import {
  Home, Search, Compass, Wrench, Crown, Shield, Menu, X, Bell, Heart, MessageCircle,
  LogOut, ChevronDown, Sparkles, MapPin, Users, ImageIcon, FileText, Calendar, DollarSign,
  Rocket, Wifi, Car, Snowflake, Dumbbell, Waves, Flame, Tv, TreePalm, Mountain, Utensils,
  Briefcase, Building, Building2, Ship, Tent, Trees, Zap, Star, Check, AlertCircle,
  Droplet, Bell as BellIcon, ShieldCheck, Lock, Camera, Loader2, ArrowLeft, ArrowRight,
  ArrowUp, ArrowDown, Banknote, Banknote as Bank, Wallet, BarChart3, Star as StarIcon,
  LayoutDashboard, Plane, CreditCard, User, LifeBuoy, Send, Clock, Filter, Upload,
  GripVertical, Save, Trash2, Settings, Plus, Edit3, Eye, MoreVertical, X as XIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  home: Home,
  search: Search,
  compass: Compass,
  wrench: Wrench,
  crown: Crown,
  shield: Shield,
  shieldcheck: ShieldCheck,
  menu: Menu,
  x: X,
  bell: Bell,
  heart: Heart,
  messagecircle: MessageCircle,
  logout: LogOut,
  chevrondown: ChevronDown,
  sparkles: Sparkles,
  mappin: MapPin,
  users: Users,
  image: ImageIcon,
  filetext: FileText,
  calendar: Calendar,
  dollarsign: DollarSign,
  rocket: Rocket,
  wifi: Wifi,
  car: Car,
  snowflake: Snowflake,
  dumbbell: Dumbbell,
  waves: Waves,
  flame: Flame,
  tv: Tv,
  treepalm: TreePalm,
  mountain: Mountain,
  utensils: Utensils,
  briefcase: Briefcase,
  building: Building,
  building2: Building2,
  ship: Ship,
  tent: Tent,
  trees: Trees,
  zap: Zap,
  star: Star,
  check: Check,
  alertcircle: AlertCircle,
  droplet: Droplet,
  lock: Lock,
  camera: Camera,
  loader2: Loader2,
  arrowleft: ArrowLeft,
  arrowright: ArrowRight,
  arrowup: ArrowUp,
  arrowdown: ArrowDown,
  banknote: Banknote,
  bank: Bank,
  wallet: Wallet,
  barchart3: BarChart3,
  layoutdashboard: LayoutDashboard,
  plane: Plane,
  creditcard: CreditCard,
  user: User,
  lifebuoy: LifeBuoy,
  send: Send,
  clock: Clock,
  filter: Filter,
  upload: Upload,
  gripvertical: GripVertical,
  save: Save,
  trash2: Trash2,
  settings: Settings,
  plus: Plus,
  edit3: Edit3,
  eye: Eye,
  morevertical: MoreVertical,
}

/**
 * Resolve a Lucide icon by name. Falls back to a generic check icon if not found.
 * Accepts kebab-case ('wifi', 'building-2', 'map-pin') or camelCase.
 */
export function resolveIcon(name?: string): any {
  if (!name) return Check
  // Try kebab-case first, then plain
  const key = name.toLowerCase().replace(/-/g, '').replace(/\s/g, '')
  return ICON_MAP[key] || Check
}
