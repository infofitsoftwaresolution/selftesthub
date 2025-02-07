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
    text: string;
    options: string[];
    correctAnswer: number;
}

export interface Quiz {
    id: number;
    title: string;
    type: string;
    duration: number;
    questions: Question[];
    is_active: boolean;
    created_at: string;
    created_by: number;
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
        typeof obj.created_at === 'string' &&
        typeof obj.created_by === 'number'
    );
} 