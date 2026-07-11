export const videoColors = {
    background: '#FFFFFF',
    ink: '#111111',
    muted: '#6E6E73',
    subtle: '#8E8E93',
    surface: '#F3F3F3',
    primary: '#3B82F6',
    danger: '#FF3B30',
    border: '#E6E6E8',
} as const;

export const videoRadii = { card: 20, thumbnail: 16, chip: 10, search: 14 } as const;

export const videoShadows = {
    soft: {
        shadowColor: '#111111',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },
} as const;
