export enum QuestionStatus {
    UNATTEMPTED = 'UNATTEMPTED',
    ANSWERED = 'ANSWERED',
    MARKED_FOR_REVIEW = 'MARKED_FOR_REVIEW'
}

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface Question {
    id: number;
    quiz_id: number;
    text: string;
    options: string[];
    correctAnswer?: number;
}

export interface Quiz {
    id: number;
    title: string;
    duration: number;
    type: string;
    questions: Question[];
    is_active: boolean;
    is_draft: boolean;
    created_by: number;
    created_at: string;
}

export interface QuizUpdate {
    title?: string;
    duration?: number;
    type?: string;
    is_active?: boolean;
    is_draft?: boolean;
}

export function isQuiz(obj: any): obj is Quiz {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'number' &&
        typeof obj.title === 'string' &&
        typeof obj.type === 'string' &&
        typeof obj.duration === 'number' &&
        Array.isArray(obj.questions) &&
        typeof obj.is_active === 'boolean' &&
        typeof obj.is_draft === 'boolean' &&
        typeof obj.created_by === 'number' &&
        typeof obj.created_at === 'string'
    );
} 