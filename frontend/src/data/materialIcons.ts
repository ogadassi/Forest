// Curated list of common Material Icons (Round variant) for the icon picker.
// Add more from https://fonts.google.com/icons as needed.
export const MATERIAL_ICONS: string[] = [
    // Nature, Elements & Places
    'forest', 'park', 'landscape', 'terrain', 'beach_access', 'ac_unit',
    'wb_sunny', 'cloud', 'thunderstorm', 'water', 'local_fire_department', 'waves',
    'filter_drama', 'nature', 'nature_people', 'volcano', 'tsunami', 'tornado', 'grass',
    'spa', 'eco', 'agriculture', 'pets', 'pest_control', 'bug_report',
    'catching_pokemon', 'brightness_2', 'brightness_4',

    // Files & Folders
    'folder', 'folder_open', 'folder_special', 'folder_shared', 'create_new_folder', 'inventory_2',
    'file_copy', 'snippet_folder', 'topic', 'source', 'drive_folder_upload', 'snippet_folder',
    'folder_zip', 'rule_folder', 'drive_file_rename_outline', 'inventory', 'archive',

    // Notes & Text
    'note', 'notes', 'note_add', 'sticky_note_2', 'edit_note', 'description', 'assignment_turned_in',
    'article', 'feed', 'text_snippet', 'summarize', 'subject', 'subtitles', 'fact_check',
    'assignment', 'assignment_ind', 'speaker_notes', 'post_add', 'history_edu', 'draw',

    // Tasks & Work
    'task', 'task_alt', 'checklist', 'checklist_rtl', 'done', 'done_all', 'check_circle',
    'work', 'work_outline', 'work_history', 'business_center', 'inbox', 'outbox', 'approval',
    'assignment_late', 'event_available', 'schedule', 'gavel', 'hourglass_empty', 'timer',

    // Code & Tech
    'code', 'terminal', 'developer_mode', 'data_object', 'data_array', 'webhook', 'integration_instructions',
    'memory', 'dns', 'computer', 'laptop', 'smartphone', 'tablet', 'devices', 'hardware',
    'keyboard', 'mouse', 'monitor', 'storage', 'cloud_upload', 'cloud_download', 'cloud_sync',
    'api', 'hub', 'lan', 'wifi', 'router', 'build', 'engineering', 'science', 'precision_manufacturing',
    'settings_ethernet', 'power', 'battery_charging_full', 'scanner', 'sim_card',

    // Ideas, Learning & Science
    'lightbulb', 'emoji_objects', 'tips_and_updates', 'biotech', 'school', 'menu_book', 'book',
    'auto_stories', 'library_books', 'local_library', 'psychology', 'psychology_alt', 'explore',
    'history_edu', 'rocket_launch', 'architecture', 'calculate', 'functions', 'model_training',

    // Objects & Tools
    'keys', 'key', 'lock', 'lock_open', 'push_pin', 'brush', 'palette', 'format_paint',
    'colorize', 'extension', 'category', 'toys', 'cut', 'content_cut', 'umbrella',
    'umbrella', 'coffee', 'local_cafe', 'sports_esports', 'videogame_asset', 'restaurant',
    'shield', 'gavel', 'balance', 'anchor', 'flash_on', 'token', 'diamond',

    // People & Identity
    'person', 'people', 'group', 'groups', 'diversity_3', 'sports_martial_arts', 'sports_gymnastics',
    'manage_accounts', 'account_circle', 'badge', 'face', 'support_agent', 'handshake',
    'supervisor_account', 'person_pin', 'emoji_people', 'record_voice_over', 'waving_hand',

    // Media & Art
    'image', 'photo', 'photo_library', 'camera_alt', 'videocam', 'movie', 'theaters',
    'music_note', 'headphones', 'mic', 'volume_up', 'queue_music', 'album', 'play_circle',
    'podcast', 'radio', 'tv', 'live_tv', 'gradient', 'color_lens', 'animation',

    // Charts, Stats & Finances
    'analytics', 'bar_chart', 'area_chart', 'pie_chart', 'show_chart', 'query_stats',
    'trending_up', 'trending_down', 'leaderboard', 'insights', 'monitoring', 'data_usage',
    'paid', 'attach_money', 'account_balance', 'account_balance_wallet', 'credit_card',
    'shopping_cart', 'receipt', 'receipt_long', 'price_check', 'savings', 'point_of_sale',

    // Health, Zen & Lifestyle
    'favorite', 'favorite_border', 'health_and_safety', 'fitness_center', 'sports',
    'self_improvement', 'local_hospital', 'medical_services', 'medication', 'monitor_heart',
    'run_circle', 'directions_walk', 'pool', 'sports_tennis', 'sports_basketball',

    // Places & Transportation
    'home', 'house', 'apartment', 'cottage', 'cabin', 'store', 'restaurant',
    'flight', 'directions_car', 'directions_bike', 'train', 'directions_bus', 'directions_boat',
    'local_shipping', 'map', 'place', 'navigation', 'travel_explore', 'explore',

    // UI, Layout & Shapes
    'dashboard', 'grid_view', 'view_list', 'view_kanban', 'view_column', 'view_module',
    'layers', 'label', 'tag', 'bookmark', 'flag', 'link', 'attach_file', 'share',
    'search', 'filter_list', 'sort', 'tune', 'settings', 'admin_panel_settings',
    'apps', 'more_vert', 'more_horiz', 'menu', 'widgets', 'inventory_2', 'circle',
    'square', 'change_history', 'pentagon', 'hexagon', 'star', 'star_border',

    // Alerts, Time & Status
    'info', 'warning', 'error', 'help', 'report', 'new_releases', 'verified',
    'notification_important', 'pending', 'block', 'cancel', 'done_outline',
    'calendar_month', 'event', 'date_range', 'history', 'update', 'alarm',
];

// Deduplicate array completely to prevent React key errors
export const UNIQUE_ICONS = Array.from(new Set(MATERIAL_ICONS));

/** Returns icons whose names contain the query words. Handles spaces gracefully. */
export function searchIcons(query: string): string[] {
    const q = query.trim().toLowerCase();
    if (!q) return UNIQUE_ICONS;

    // Split search query by spaces to allow fuzzy multi-word matches
    const terms = q.split(/\s+/);

    return UNIQUE_ICONS.filter(icon => {
        // Compare with both raw icon name (underscores) and human readable name (spaces)
        const readable = icon.replace(/_/g, ' ');
        return terms.every(term => icon.includes(term) || readable.includes(term));
    });
}
