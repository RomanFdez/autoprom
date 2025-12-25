import {
    TrendingUp, Description, Landscape, Construction,
    Truck, Shield, Smartphone, Armchair, Hammer,
    HelpCircle, Tag, FileText, PenTool,
    Coffee, Utensils, Beer, Wine, ShoppingCart, ShoppingBag, Gift,
    Heart, Activity, User, Briefcase, Film, Tv, Gamepad2, Music,
    Zap, Droplet, Wifi, Plane, Bus, Train, Home, School, Book, Mountain,
    DollarSign
} from 'lucide-react-native';

export const getIcon = (iconName, size = 24, color = 'black') => {
    const icons = {
        'trending_up': TrendingUp,
        'description': Description,
        'landscape': Landscape,
        'construction': Construction,
        'local_shipping': Truck,
        'security': Shield,
        'devices': Smartphone,
        'chair': Armchair,
        'handyman': Hammer,
        'category': Mountain,
        'money': DollarSign, // Fix for existing 'money' icon falling back to ? // Replaced HelpCircle with Mountain
        // Tag icons
        'impuestos': Tag,
        'documentos': FileText,
        'notaria': PenTool,
        // New Added Icons
        'coffee': Coffee,
        'utensils': Utensils,
        'beer': Beer,
        'wine': Wine,
        'shopping_cart': ShoppingCart,
        'shopping_bag': ShoppingBag,
        'gift': Gift,
        'heart': Heart,
        'activity': Activity,
        'person': User,
        'briefcase': Briefcase,
        'film': Film,
        'tv': Tv,
        'gamepad': Gamepad2,
        'music': Music,
        'zap': Zap,
        'droplet': Droplet,
        'wifi': Wifi,
        'plane': Plane,
        'bus': Bus,
        'train': Train,
        'home': Home,
        'school': School,
        'book': Book
    };

    const IconComponent = icons[iconName] || HelpCircle;
    return <IconComponent size={size} color={color} />;
};
