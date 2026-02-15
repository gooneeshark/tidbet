
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SlotSite {
  name: string;
  url: string;
  tagline: string;
  logo?: string;
  image?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
}
