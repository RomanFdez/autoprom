import {
    FileText, Mountain, Hammer, Truck, Shield, Monitor, Armchair, Wrench, Grid,
    Home, ShoppingCart, DollarSign, Briefcase, Heart, Star, Coffee, Utensils
} from 'lucide-react';

export const ICON_MAP = {
    description: FileText,
    landscape: Mountain,
    construction: Hammer,
    mudanza: Truck,
    local_shipping: Truck, // Alias for compatibility
    security: Shield,
    technology: Monitor,
    devices: Monitor, // Alias
    muebles: Armchair,
    chair: Armchair, // Alias
    tools: Wrench,
    handyman: Wrench, // Alias
    category: Grid,
    home: Home,
    shopping: ShoppingCart,
    money: DollarSign,
    work: Briefcase,
    health: Heart,
    star: Star,
    coffee: Coffee,
    food: Utensils
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP).filter(k =>
    ['FileText', 'Mountain', 'Hammer', 'Truck', 'Shield', 'Monitor', 'Armchair', 'Wrench', 'Grid', 'Home', 'ShoppingCart', 'DollarSign', 'Briefcase', 'Heart', 'Star', 'Coffee', 'Utensils']
        .includes(ICON_MAP[k]?.render?.displayName || ICON_MAP[k]?.displayName || (ICON_MAP[k].name)) ? false : true
    // The above filter is tricky because Lucide components are functions. 
    // Let's just list the "primary" keys we want to show in the picker.
);

export const ICON_KEYS = [
    'description', 'landscape', 'construction', 'mudanza', 'security',
    'technology', 'muebles', 'tools', 'category', 'home', 'shopping',
    'money', 'work', 'health', 'star', 'coffee', 'food'
];

export const getIcon = (name) => {
    return ICON_MAP[name] || Grid;
};
