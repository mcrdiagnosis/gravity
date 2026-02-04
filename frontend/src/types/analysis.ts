export interface ExecutiveSummary {
    title: string;
    participants?: string;
    context: string;
    summary: string;
}

export interface KeyPoint {
    text: string;
    is_urgent: boolean;
}

export interface ActionItem {
    description: string;
    owner: string;
    due_date?: string;
}

export interface Metadata {
    keywords: string[];
    category: "Trabajo" | "Personal" | "Legal" | "Ideas" | "Otro";
    sentiment: "Positivo" | "Neutral" | "Tenso" | "Negativo";
}

export interface CalendarEvent {
    id?: string; // Unique ID for finding event
    type: 'reminder' | 'event';
    title: string;
    start_date: string; // ISO format
    end_date: string; // ISO format
    description: string;
    location?: string;
    status?: 'pending' | 'scheduled' | 'added';
    notificationId?: number;
}

export interface Attachment {
    id: string;
    type: 'photo' | 'note';
    content: string; // Base64 for photo, text for note
    timestamp: string;
    description?: string; // AI-generated description for photos
}

export interface GravityAnalysisResult {
    id?: string;
    date?: string;
    duration?: number;
    audioPath?: string;
    audioSize?: number; // Size in bytes
    transcript?: string; // Full text transcript for search
    executive_summary: ExecutiveSummary;
    key_points: KeyPoint[];
    mermaid_diagram: string;
    actions: ActionItem[];
    calendar_events?: CalendarEvent[];
    metadata: Metadata;
    attachments?: Attachment[]; // Photos and notes
}
